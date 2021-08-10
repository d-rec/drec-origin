import { Injectable, NotFoundException, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  CertificateService,
  CERTIFICATE_SERVICE_TOKEN,
  IIssueCommandParams,
} from '@energyweb/origin-247-certificate';
import { ICertificateMetadata } from '../../utils/types';
import { DateTime } from 'luxon';
import {
  FilterDTO,
  ReadsService as BaseReadsService,
} from '@energyweb/energy-api-influxdb';
import { DeviceService } from '../device/device.service';
import { IDeviceGroup } from '../device-group/device-group.entity';
import { Device, IDevice } from '../device/device.entity';
import { BASE_READ_SERVICE } from '../reads/const';
import { OrganizationService } from '../organization';
import { DeviceGroupService } from '../device-group/device-group.service';
import { ConfigService } from '@nestjs/config';
import { values, groupBy } from 'lodash';

export type DeviceKey =
  | 'id'
  | 'drecID'
  | 'status'
  | 'registrant_organisation_code'
  | 'project_name'
  | 'country_code'
  | 'fuel_code'
  | 'device_type_code';

@Injectable()
export class IssuerService {
  private readonly logger = new Logger(IssuerService.name);

  constructor(
    private groupService: DeviceGroupService,
    private deviceService: DeviceService,
    private organizationService: OrganizationService,
    @Inject(CERTIFICATE_SERVICE_TOKEN)
    private readonly certificateService: CertificateService<ICertificateMetadata>,
    @Inject(BASE_READ_SERVICE)
    private baseReadsService: BaseReadsService,
    private readonly configService: ConfigService,
  ) {}

  // @Cron(CronExpression.EVERY_10_SECONDS)
  @Cron('0 30 23 * * *') // Every day at 23:30 - Server Time
  async handleCron(): Promise<void> {
    const deviceGroupRule1: DeviceKey =
      this.configService.get<DeviceKey>('DEVICE_GROUP_RULE_1') ||
      ('registrant_organisation_code' as DeviceKey);
    const deviceGroupRule2: DeviceKey =
      this.configService.get<DeviceKey>('DEVICE_GROUP_RULE_2') ||
      ('country_code' as DeviceKey);
    this.logger.debug('Called every day at 23:30 Server time');

    const startDate = DateTime.now().minus({ days: 1 }).toUTC();
    const endDate = DateTime.now().minus({ minute: 1 }).toUTC();

    this.logger.debug(`Start date ${startDate} - End date ${endDate}`);

    const groups = await this.groupService.getAll();
    await Promise.all(
      groups.map(async (group: IDeviceGroup) => {
        group.devices = await this.deviceService.findForGroup(group.id);
        return await this.issueCertificateForGroup(group, startDate, endDate);
      }),
    );
    const devicesWithoutGroups = await this.deviceService.findMultiple({
      where: {
        groupId: null,
      },
    });

    if (!devicesWithoutGroups.length) {
      return;
    }
    const ownerGroupedDevices = values(
      groupBy(devicesWithoutGroups, deviceGroupRule1),
    );

    await Promise.all(
      ownerGroupedDevices.flatMap(async (ownerBasedGroup: IDevice[], i) => {
        values(groupBy(ownerBasedGroup, deviceGroupRule2)).map(
          async (countryBasedGroup: IDevice[], j) => {
            const categorizedGroup: IDeviceGroup = {
              id: 0,
              name: `Default Group ${ownerBasedGroup[i].registrant_organisation_code}_${ownerBasedGroup[j][deviceGroupRule2]}`,
              organizationId: ownerBasedGroup[i].registrant_organisation_code,
              devices: countryBasedGroup,
            };
            return await this.issueCertificateForGroup(
              categorizedGroup,
              startDate,
              endDate,
            );
          },
        );
      }),
    );
  }

  private async issueCertificateForGroup(
    group: IDeviceGroup,
    startDate: DateTime,
    endDate: DateTime,
  ): Promise<void> {
    const readsFilter: FilterDTO = {
      offset: 0,
      limit: 1000,
      start: startDate.toString(),
      end: endDate.toString(),
    };

    if (!group?.devices?.length) {
      return;
    }
    const org = await this.organizationService.findOne(group.organizationId);
    if (!org) {
      throw new NotFoundException(
        `No organization found with code ${group.organizationId}`,
      );
    }
    const groupReads: number[] = [];
    await Promise.all(
      group.devices.map(async (device: IDevice) =>
        groupReads.push(await this.getDeviceFullReads(device.id, readsFilter)),
      ),
    );
    const totalReadValue = groupReads.reduce(
      (accumulator, currentValue) => accumulator + currentValue,
      0,
    );

    if (!totalReadValue) {
      return;
    }

    // Convert from W to kW
    const totalReadValueKw = Math.round(totalReadValue * 10 ** -3);
    console.log('Total read value: ', totalReadValueKw);
    const issuance: IIssueCommandParams<ICertificateMetadata> = {
      deviceId: group.id?.toString(), // groupID
      energyValue: totalReadValueKw.toString(),
      fromTime: new Date(startDate.toString()),
      toTime: new Date(endDate.toString()),
      toAddress: org.blockchainAccountAddress,
      userId: org.blockchainAccountAddress,
      metadata: {
        deviceIds: group.devices.map((device: IDevice) => device.id),
        groupId: group.id?.toString() || null,
      },
    };
    this.logger.log(
      `Issuance: ${JSON.stringify(issuance)}, Group name: ${group.name}`,
    );
    return await this.issueCertificate(issuance);
  }

  private async getDeviceFullReads(
    deviceId: number,
    filter: FilterDTO,
  ): Promise<number> {
    const allReads = await this.baseReadsService.find(
      deviceId.toString(),
      filter,
    );
    return allReads.reduce(
      (accumulator, currentValue) => accumulator + currentValue.value,
      0,
    );
  }

  private async issueCertificate(
    reading: IIssueCommandParams<ICertificateMetadata>,
  ): Promise<void> {
    this.logger.log(`Issuing a certificate for reading`);
    const issuedCertificate = await this.certificateService.issue(reading);
    this.logger.log(`Issued a certificate with ID ${issuedCertificate.id}`);
    return;
  }
}

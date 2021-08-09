import { Injectable, NotFoundException, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  CertificateService,
  CERTIFICATE_SERVICE_TOKEN,
  IIssueCommandParams,
} from '@energyweb/origin-247-certificate';
import { CertificateSourceType, ICertificateMetadata } from '../../utils/types';
import { DateTime } from 'luxon';
import {
  FilterDTO,
  ReadsService as BaseReadsService,
  ReadDTO,
} from '@energyweb/energy-api-influxdb';
import { DeviceService } from '../device/device.service';
import { DeviceGroup, IDeviceGroup } from '../device-group/device-group.entity';
import { Device, IDevice } from '../device/device.entity';
import { BASE_READ_SERVICE } from '../reads/const';
import { OrganizationService } from '../organization';
import { DeviceGroupService } from '../device-group/device-group.service';

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
  ) {}

  // @Cron(CronExpression.EVERY_10_MINUTES)
  @Cron(CronExpression.EVERY_10_SECONDS)
  // @Cron('0 47 16 * * *') // Every day at 23:30 - Server Time
  async handleCron(): Promise<void> {
    this.logger.debug('Called every 10 minutes');

    const startDate = DateTime.now().minus({ days: 1 }).toUTC();
    const endDate = DateTime.now().minus({ minute: 1 }).toUTC();

    this.logger.warn(`Start date ${startDate} - End date ${endDate}`);
    const groups = await this.groupService.getAll();
    await Promise.all(
      groups.map(async (group: DeviceGroup) => {
        group.devices = await this.deviceService.findForGroup(group.id);
        return await this.issueCertificateForGroup(group, startDate, endDate);
      }),
    );
    const devicesWithoutGroups = await this.deviceService.findMultiple({
      where: {
        groupId: null,
      },
    });

    if (devicesWithoutGroups.length) {
      const ownerGroupedDevices = this.groupBy(
        devicesWithoutGroups,
        'registrant_organisation_code',
      );
      // const categorizedGroups: IDeviceGroup[] = [];
      await Promise.all(
        ownerGroupedDevices?.map(async (ownerBasedGroup: Device[], i) => {
          this.groupBy(ownerBasedGroup, 'country_code')?.map(
            async (countryBasedGroup: Device[], j) => {
              const categorizedGroup: IDeviceGroup = {
                id: 0,
                name: `${ownerBasedGroup[i].registrant_organisation_code}_${countryBasedGroup[j].country_code}`,
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
      // this.logger.warn(
      //   `Categorized Groups: ${JSON.stringify(categorizedGroups)}`,
      // );
    }
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

    const org = await this.organizationService.findOne(group.organizationId);
    if (!org) {
      throw new NotFoundException(
        `No organization found with code ${group.organizationId}`,
      );
    }
    const groupReads: number[] = [];
    await Promise.all(
      group.devices.map(async (device: Device) =>
        groupReads.push(await this.getDeviceFullReads(device.id, readsFilter)),
      ),
    );
    const totalReadValue = groupReads.reduce(
      (accumulator, currentValue) => accumulator + currentValue,
      0,
    );
    // Convert from W to kW
    const totalReadValueKw = Math.round(totalReadValue * 10 ** -3);
    console.log('totalReadValue: ', totalReadValue);
    const issuance: IIssueCommandParams<ICertificateMetadata> = {
      deviceId: group.id.toString(), // groupID
      energyValue: totalReadValueKw.toString(),
      fromTime: new Date(startDate.toString()),
      toTime: new Date(endDate.toString()),
      toAddress: org.blockchainAccountAddress,
      userId: org.blockchainAccountAddress,
      metadata: {
        type: CertificateSourceType.Generator,
        deviceIds: group.devices.map((device: Device) => device.id),
        id: group.id.toString(),
      },
    };
    this.logger.log(
      `Issuance: ${JSON.stringify(issuance)}, Group name: ${group.name}`,
    );
    return;
    // return await this.issueCertificate(issuance);
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

  private groupBy(arr: IDevice[], prop: string): Array<any> {
    const map = new Map(Array.from(arr, (obj) => [obj[prop], []]));
    arr.forEach((obj) => map.get(obj[prop]).push(obj));
    return Array.from(map.values());
  }
}

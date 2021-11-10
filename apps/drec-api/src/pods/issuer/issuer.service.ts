import { Injectable, NotFoundException, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  CertificateService,
  CERTIFICATE_SERVICE_TOKEN,
  IIssueCommandParams,
  IIssuedCertificate,
  ITransferCommand,
} from '@energyweb/origin-247-certificate';
import { ICertificateMetadata } from '../../utils/types';
import { DateTime } from 'luxon';
import {
  FilterDTO,
  ReadsService as BaseReadsService,
} from '@energyweb/energy-api-influxdb';
import { DeviceService } from '../device/device.service';
import { BASE_READ_SERVICE } from '../reads/const';
import { OrganizationService } from '../organization/organization.service';
import { DeviceGroupService } from '../device-group/device-group.service';
import { IDevice } from '../../models';
import { DeviceGroup } from '../device-group/device-group.entity';

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

  // @Cron(CronExpression.EVERY_30_SECONDS)
  @Cron('0 30 23 * * *') // Every day at 23:30 - Server Time
  async handleCron(): Promise<void> {
    this.logger.debug('Called every day at 23:30 Server time');

    const startDate = DateTime.now().minus({ days: 1 }).toUTC();
    const endDate = DateTime.now().minus({ minute: 1 }).toUTC();

    this.logger.debug(`Start date ${startDate} - End date ${endDate}`);

    const groups = await this.groupService.getAll();
    await Promise.all(
      groups.map(async (group: DeviceGroup) => {
        group.devices = await this.deviceService.findForGroup(group.id);
        const organization = await this.organizationService.findOne(
          group.organizationId,
        );
        group.organization = {
          name: organization.name,
          blockchainAccountAddress: organization.blockchainAccountAddress,
        };
        return await this.issueCertificateForGroup(group, startDate, endDate);
      }),
    );
  }

  private async issueCertificateForGroup(
    group: DeviceGroup,
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

    const totalReadValueKw = await this.handleLeftoverReads(
      group,
      totalReadValue,
    );

    if (!totalReadValueKw) {
      return;
    }

    const deviceGroup = {
      ...group,
      devices: [],
    };
    const issuance: IIssueCommandParams<ICertificateMetadata> = {
      deviceId: group.id?.toString(), // This is the device group id not a device id
      energyValue: totalReadValueKw.toString(),
      fromTime: new Date(startDate.toString()),
      toTime: new Date(endDate.toString()),
      toAddress: org.blockchainAccountAddress,
      userId: org.blockchainAccountAddress,
      metadata: {
        deviceIds: group.devices.map((device: IDevice) => device.id),
        deviceGroup,
        groupId: group.id?.toString() || null,
      },
    };
    this.logger.log(
      `Issuance: ${JSON.stringify(issuance)}, Group name: ${group.name}`,
    );
    const issuedCertificate = await this.issueCertificate(issuance);
    await this.transferCertificateToBuyer(group, issuedCertificate);
    return;
  }

  private async transferCertificateToBuyer(
    group: DeviceGroup,
    certificate: IIssuedCertificate<ICertificateMetadata>,
  ) {
    if (
      !certificate ||
      !group.buyerAddress ||
      !group.buyerId ||
      !group.organization?.blockchainAccountAddress
    ) {
      return;
    }
    this.logger.log(`Transfering a certificate`);
    const transferCommand: ITransferCommand = {
      certificateId: certificate.id,
      fromAddress: group.organization.blockchainAccountAddress,
      toAddress: group.buyerAddress,
      energyValue: certificate.energy.publicVolume,
    };
    await this.certificateService.transfer(transferCommand);
  }

  private async handleLeftoverReads(
    group: DeviceGroup,
    totalReadValueW: number,
  ): Promise<number> {
    // Logic
    // 1. Get the accummulated read values from devices
    // 2. Transform current value from watts to kw
    // 3. Add any leftover value from group to the current total value
    // 4. Separate all decimal values from the curent kw value and store it as leftover value to the device group
    // 5. Return all the integer value from the current kw value (if any) and continue issuing the certificate

    const totalReadValueKw = group.leftoverReads
      ? totalReadValueW / 10 ** 3 + group.leftoverReads
      : totalReadValueW / 10 ** 3;
    const { integralVal, decimalVal } =
      this.separateIntegerAndDecimal(totalReadValueKw);
    await this.groupService.updateLeftOverRead(group.id, decimalVal);

    return integralVal;
  }

  private separateIntegerAndDecimal(num: number): {
    integralVal: number;
    decimalVal: number;
  } {
    if (!num) {
      return { integralVal: 0, decimalVal: 0 };
    }
    const integralVal = Math.floor(num);
    const decimalVal = this.roundDecimalNumber(num - integralVal);
    return { integralVal, decimalVal };
  }

  private roundDecimalNumber(num: number): number {
    if (num === 0) {
      return num;
    }
    const precision = 2;
    return Math.round(num * 10 ** precision) / 10 ** precision;
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
  ): Promise<IIssuedCertificate<ICertificateMetadata>> {
    this.logger.log(`Issuing a certificate for reading`);
    const issuedCertificate = await this.certificateService.issue(reading);
    this.logger.log(`Issued a certificate with ID ${issuedCertificate.id}`);
    return issuedCertificate;
  }
}

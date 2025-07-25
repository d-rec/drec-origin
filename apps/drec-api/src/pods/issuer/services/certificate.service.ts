import { Injectable, Logger } from '@nestjs/common';

import {
  IGetAllCertificatesOptions,
  IIssueCommandParams,
  OffChainCertificateService,
} from '@energyweb/origin-247-certificate';
import { ICertificateMetadata } from '../../../utils/types';

import { IDevice } from '../../../models';
import { CertificateType, StandardCompliance } from '../../../utils/enums';
import { DeviceGroup } from '../../device-group/device-group.entity';
import { Profile } from '../../../lib/profile';

@Injectable()
export class CertificateService {
  private readonly logger = new Logger(CertificateService.name);

  constructor(
    private readonly offChainCertificateService: OffChainCertificateService<ICertificateMetadata>,
  ) {}

  issueFromAPI(reading: IIssueCommandParams<ICertificateMetadata>): void {
    this.logger.verbose(`With in issueCertificateFromAPI`);
    reading.fromTime = new Date(reading.fromTime);
    reading.toTime = new Date(reading.toTime);
    this.issue(reading);
  }

  @Profile()
  public async issue(
    reading: IIssueCommandParams<ICertificateMetadata>,
  ): Promise<void> {
    this.logger.log(`Issuing a certificate for reading`);
    await this.offChainCertificateService.issue(reading);
  }

  get(request: IGetAllCertificatesOptions): Promise<any[]> {
    return this.offChainCertificateService.getAll(request);
  }

  /**
   * Generate certificate issuance parameters
   *
   * @param group - The device group for certificate issuance
   * @param issueTotalReadValue - The total energy value in watts
   * @param fromTime - The start date for the certificate
   * @param toTime - The end date for the certificate
   * @param certificateTransactionUID - Unique identifier for the certificate transaction
   * @returns Prepared issuance command parameters
   */
  public getIssuanceParams(
    group: DeviceGroup,
    devices: IDevice[],
    energyValue: number,
    fromTime: Date,
    toTime: Date,
    certificateTransactionUID: string,
  ): IIssueCommandParams<ICertificateMetadata> {
    return {
      deviceId: group.id?.toString(),
      energyValue: energyValue.toString(),
      fromTime,
      toTime,
      toAddress: group.buyerAddress,
      userId: group.buyerAddress,
      metadata: {
        version: 'v1.0',
        buyerReservationId: group.devicegroup_uid,
        isStandardIssuanceRequested: StandardCompliance.IREC,
        type: CertificateType.REC,
        deviceIds: devices.map((device: IDevice) => device.externalId),
        groupId: group.id?.toString() || null,
        certificateTransactionUID: certificateTransactionUID.toString(),
      },
    };
  }
}

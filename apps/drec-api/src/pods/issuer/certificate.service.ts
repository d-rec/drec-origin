import { Inject, Injectable, Logger } from '@nestjs/common';

import {
    IGetAllCertificatesOptions,
    IIssueCommandParams,
    OffChainCertificateService
} from '@energyweb/origin-247-certificate';
import { InjectQueue } from '@nestjs/bull';
import { ICertificateMetadata } from '../../utils/types';

import { Queues } from '../../../src/utils/enums/queues.enum';
import { BASE_READ_SERVICE } from '../reads/constants';

@Injectable()
export class CertificateService {
  private readonly logger = new Logger(CertificateService.name);

  constructor(
    @InjectQueue(Queues.LateOngoingIssuance)
    @Inject(BASE_READ_SERVICE)
    private readonly offChainCertificateService: OffChainCertificateService<ICertificateMetadata>,
  ) {}

  issueFromAPI(
    reading: IIssueCommandParams<ICertificateMetadata>,
  ): void {
    this.logger.verbose(`With in issueCertificateFromAPI`);
    reading.fromTime = new Date(reading.fromTime);
    reading.toTime = new Date(reading.toTime);
    this.issue(reading);
  }

  public async issue(
    reading: IIssueCommandParams<ICertificateMetadata>,
  ): Promise<void> {
    this.logger.log(`Issuing a certificate for reading`);
    await this.offChainCertificateService.issue(reading);
  }

  getCertificateData(request: IGetAllCertificatesOptions): Promise<any[]> {
    return this.offChainCertificateService.getAll(request);
  }
}

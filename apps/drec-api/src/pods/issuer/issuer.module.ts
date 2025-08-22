import { Module } from '@nestjs/common';

import { HttpModule } from '@nestjs/axios';

import { DeviceModule } from '../device/device.module';
// import { CertificateModule } from '@energyweb/origin-247-certificate';
import { OffChainCertificateModule } from '@energyweb/origin-247-certificate';
import { ReadsModule } from '../reads/reads.module';
import { OrganizationModule } from '../organization/organization.module';
import { DeviceGroupModule } from '../device-group/device-group.module';
import { IssuerService } from './services/issuer.service';
import { DRECIssuerController } from './drec-issuer.controller';
import { SynchronizeBlockchainTaskService } from './synchronize-blockchain-task.service';
import { CertificateLogModule } from '../certificate-log/certificate-log.module';
import { UserModule } from '../user/user.module';
import { FileModule } from '../file';
import { BullModule } from '@nestjs/bull';
import { LateOngoingIssuanceProcessor } from './processors/late-ongoing-issuance.processor';
import { Queues } from '../../../src/utils/enums/queues.enum';
import { CertificateService } from './services/certificate.service';
import { LateOngoingIssuanceService } from './services/late-ongoing-issuance.service';
import { HistoricalIssuanceService } from './services/historical-issuance.service';
import { OngoingIssuanceService } from './services/ongoing-issuance.service';
import { registerQueues } from '../../lib/helpers/registerQueues';
import { OngoingIssuanceProcessor } from './processors/ongoing-issuance.processor';
import { HistoricalIssuanceProcessor } from './processors/historical-issuance.processor';
import { MissingCyclesProcessor } from './processors/missing-cycles.processor';

@Module({
  imports: [
    DeviceModule,
    DeviceGroupModule,
    CertificateLogModule,
    // CertificateModule,
    OffChainCertificateModule,
    ReadsModule,
    OrganizationModule,
    HttpModule,
    UserModule,
    FileModule,
    registerQueues(
      Queues.LateOngoingIssuance,
      Queues.HistoricalIssuance,
      Queues.OngoingIssuance,
      Queues.MissingCycles,
    ),
  ],
  providers: [
    CertificateService,
    LateOngoingIssuanceService,
    IssuerService,
    SynchronizeBlockchainTaskService,
    HistoricalIssuanceService,
    OngoingIssuanceService,
    LateOngoingIssuanceProcessor,
    OngoingIssuanceProcessor,
    HistoricalIssuanceProcessor,
    MissingCyclesProcessor,
  ],
  exports: [
    IssuerService,
    CertificateService,
    LateOngoingIssuanceService,
    BullModule,
    HistoricalIssuanceService,
    OngoingIssuanceService,
  ],
  controllers: [DRECIssuerController],
})
export class IssuerModule {}

import { Module } from '@nestjs/common';

import { HttpModule } from '@nestjs/axios';

import { DeviceModule } from '../device/device.module';
// import { CertificateModule } from '@energyweb/origin-247-certificate';
import { OffChainCertificateModule } from '@energyweb/origin-247-certificate';
import { ReadsModule } from '../reads/reads.module';
import { OrganizationModule } from '../organization/organization.module';
import { DeviceGroupModule } from '../device-group/device-group.module';
import { IssuerService } from './issuer.service';
import { DRECIssuerController } from './drec-issuer.controller';
import { SynchronizeBlockchainTaskService } from './synchronize-blockchain-task.service';
import { CertificateLogModule } from '../certificate-log/certificate-log.module';
import { UserModule } from '../user/user.module';
import { FileModule } from '../file';
import { BullModule } from '@nestjs/bull';
import { LateOngoingIssuanceProcessor } from './late-ongoing-issuance.processor';
import { Queues } from '../../../src/utils/enums/queues.enum';
import { CertificateService } from './certificate.service';
import { LateOngoingIssuanceService } from './late-ongoing-issuance.service';

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
    BullModule.registerQueue({
      name: Queues.LateOngoingIssuance,
    }),
  ],
  providers: [
    CertificateService,
    LateOngoingIssuanceService,
    IssuerService,
    SynchronizeBlockchainTaskService,
    LateOngoingIssuanceProcessor,
  ],
  exports: [IssuerService, CertificateService, LateOngoingIssuanceService, BullModule],
  controllers: [DRECIssuerController],
})
export class IssuerModule {}

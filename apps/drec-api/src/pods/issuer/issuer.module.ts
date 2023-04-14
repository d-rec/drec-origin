import { Module } from '@nestjs/common';

import {HttpModule} from '@nestjs/axios';

import { DeviceModule } from '../device/device.module';
// import { CertificateModule } from '@energyweb/origin-247-certificate';
import { OffChainCertificateModule } from '@energyweb/origin-247-certificate';
import { ReadsModule } from '../reads/reads.module';
import { OrganizationModule } from '../organization/organization.module';
import { DeviceGroupModule } from '../device-group/device-group.module';
import { IssuerService } from './issuer.service';
import {DrecIssuerController} from './drec-issuer.controller';
import { SynchronizeBlockchainTaskService } from './synchronize-blockchain-task.service';



@Module({
  imports: [
    DeviceModule,
    DeviceGroupModule,
    // CertificateModule,
    OffChainCertificateModule,
    ReadsModule,
    OrganizationModule,
    HttpModule,
  ],
  providers: [IssuerService,SynchronizeBlockchainTaskService],
  exports: [IssuerService],
  controllers:[DrecIssuerController]
})
export class IssuerModule {}

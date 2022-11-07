import { Module } from '@nestjs/common';

import {HttpModule} from '@nestjs/axios';

import { DeviceModule } from '../device/device.module';
import { CertificateModule } from '@energyweb/origin-247-certificate';
import { ReadsModule } from '../reads/reads.module';
import { OrganizationModule } from '../organization/organization.module';
import { DeviceGroupModule } from '../device-group/device-group.module';
import { IssuerService } from './issuer.service';
import {DrecIssuerController} from './drec-issuer.controller';



@Module({
  imports: [
    DeviceModule,
    DeviceGroupModule,
    CertificateModule,
    ReadsModule,
    OrganizationModule,
    HttpModule
  ],
  providers: [IssuerService],
  exports: [IssuerService],
  controllers:[DrecIssuerController]
})
export class IssuerModule {}

import { Module } from '@nestjs/common';
import { DeviceModule } from '../device/device.module';
import { CertificateModule } from '@energyweb/origin-247-certificate';
import { ReadsModule } from '../reads/reads.module';
import { OrganizationModule } from '../organization';
import { DeviceGroupModule } from '../device-group/device-group.module';
import { IssuerService } from './issuer.service';

@Module({
  imports: [
    DeviceModule,
    DeviceGroupModule,
    CertificateModule,
    ReadsModule,
    OrganizationModule,
  ],
  providers: [IssuerService],
  exports: [IssuerService],
})
export class IssuerModule {}

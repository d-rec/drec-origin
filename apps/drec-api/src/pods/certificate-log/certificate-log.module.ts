import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CertificateLogController } from './certificate-log.controller';
import { CertificateLogService } from './certificate-log.service';
import { CheckCertificateIssueDateLogForDeviceEntity } from '../device/check_certificate_issue_date_log_for_device.entity';
import { Certificate } from '@energyweb/issuer-api';
import { DeviceGroupModule } from '../device-group/device-group.module';
import { DeviceModule } from '../device/device.module';
import { OffChainCertificateModule } from '../utils/origin-247-certificate/offchain-certificate/offchain-certificate.module';
import { CertificateReadModelEntity } from '../utils/origin-247-certificate/offchain-certificate/repositories/certificate-read-modal/certificate-read-model.entity';
import { DeviceGroup } from '../device-group/device-group.entity';
import { OrganizationModule } from '../organization/organization.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CheckCertificateIssueDateLogForDeviceEntity,
      Certificate,
      CertificateReadModelEntity,
      DeviceGroup,
    ]),
    DeviceGroupModule,
    DeviceModule,
    OffChainCertificateModule,
    OrganizationModule,
    UserModule,
  ],
  controllers: [CertificateLogController],
  providers: [CertificateLogService],
  exports: [CertificateLogService],
})
export class CertificateLogModule {}

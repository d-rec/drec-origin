import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CertificateLogController } from './certificate-log.controller';
import { CertificateLogService } from './certificate-log.service';
import { CheckCertificateIssueDateLogForDeviceEntity } from '../../pods/device/check_certificate_issue_date_log_for_device.entity';
import { Certificate } from '@energyweb/issuer-api';
import { DeviceGroupModule } from '../../pods/device-group/device-group.module';
import { DeviceModule } from '../../pods/device/device.module';
import { OffChainCertificateModule } from '../certificates/offchain-certificate/offchain-certificate.module';
import { CertificateReadModelEntity } from '../certificates/offchain-certificate/repositories/certificate-read-modal/certificate-read-model.entity';
import { DeviceGroup } from '../../pods/device-group/device-group.entity';
import { OrganizationModule } from '../../pods/organization/organization.module';
import { UserModule } from '../../pods/user/user.module';

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

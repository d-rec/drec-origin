import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CertificateLogController } from './certificate-log.controller';
import { CertificateLogService } from './certificate-log.service';
import {CheckCertificateIssueDateLogForDeviceEntity} from '../device/check_certificate_issue_date_log_for_device.entity'
import {Certificate} from '@energyweb/issuer-api';
import {DeviceGroupModule} from '../device-group/device-group.module'
import {DeviceModule} from'../device/device.module';
import { OffChainCertificateModule } from '@energyweb/origin-247-certificate';

@Module({

  imports: [
  
    TypeOrmModule.forFeature([CheckCertificateIssueDateLogForDeviceEntity,Certificate]),
    DeviceGroupModule,
    DeviceModule,
    OffChainCertificateModule
  ],
  controllers: [CertificateLogController],
  providers: [CertificateLogService]
})
export class CertificateLogModule {}

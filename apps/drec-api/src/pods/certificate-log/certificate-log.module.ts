import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CertificateLogController } from './certificate-log.controller';
import { CertificateLogService } from './certificate-log.service';
import {CheckCertificateIssueDateLogForDeviceEntity} from '../device/check_certificate_issue_date_log_for_device.entity'
import {Certificate} from '@energyweb/issuer-api';
import {DeviceGroupModule} from '../device-group/device-group.module'
import {DeviceModule} from'../device/device.module';
import { OffChainCertificateModule } from '@energyweb/origin-247-certificate';
import { CertificateReadModelEntity } from '@energyweb/origin-247-certificate/dist/js/src/offchain-certificate/repositories/CertificateReadModel/CertificateReadModel.entity';
import {DeviceGroup} from '../device-group/device-group.entity'


@Module({

  imports: [
  
    TypeOrmModule.forFeature([CheckCertificateIssueDateLogForDeviceEntity,Certificate,CertificateReadModelEntity,DeviceGroup]),
    DeviceGroupModule,
    DeviceModule,
    OffChainCertificateModule
  ],
  controllers: [CertificateLogController],
  providers: [CertificateLogService]
})
export class CertificateLogModule {}

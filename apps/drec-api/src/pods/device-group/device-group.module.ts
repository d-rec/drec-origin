import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceModule } from '../device/device.module';
import { ReadsModule } from '../reads/reads.module';
import { BuyerReservationController } from './buyer-reservation.controller';
import { DeviceGroup } from './device-group.entity';
import { DeviceGroupService } from './device-group.service';
import { OrganizationModule } from '../organization/organization.module';
import { FileModule } from '../file';
import { DeviceCsvProcessingFailedRowsEntity } from './device_csv_processing_failed_rows.entity';
import { DeviceCsvFileProcessingJobsEntity } from './device_csv_processing_jobs.entity';
import { YieldConfigModule } from '../yield-config/yieldconfig.module';
import { DeviceGroupNextIssueCertificate } from './device_group_issuecertificate.entity';
import { CheckCertificateIssueDateLogForDeviceGroupEntity } from './check_certificate_issue_date_log_for_device_group.entity';
import { HistoryDeviceGroupNextIssueCertificate } from './history_next_issuance_date_log.entity';
import { CertificateReadModelEntity } from '@energyweb/origin-247-certificate/dist/js/src/offchain-certificate/repositories/CertificateReadModel/CertificateReadModel.entity';
import { CheckCertificateIssueDateLogForDeviceEntity } from '../device/check_certificate_issue_date_log_for_device.entity';
import { Certificate } from '@energyweb/issuer-api';
import { UserModule } from '../user/user.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      DeviceGroup,
      DeviceCsvFileProcessingJobsEntity,
      DeviceCsvProcessingFailedRowsEntity,
      DeviceGroupNextIssueCertificate,
      CheckCertificateIssueDateLogForDeviceGroupEntity,
      HistoryDeviceGroupNextIssueCertificate,
      CertificateReadModelEntity,
      CheckCertificateIssueDateLogForDeviceEntity,
      Certificate,
    ]),
    forwardRef(() => DeviceModule),

    OrganizationModule,
    YieldConfigModule,
    FileModule,
    UserModule,
  ],
  providers: [DeviceGroupService],
  exports: [DeviceGroupService],
  controllers: [BuyerReservationController],
})
export class DeviceGroupModule {}

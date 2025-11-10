import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceModule } from '../device/device.module';
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
import { CheckCertificateIssueDateLogForDeviceEntity } from '../device/check_certificate_issue_date_log_for_device.entity';
import { Certificate } from '@energyweb/issuer-api';
import { UserModule } from '../user/user.module';
import { CertificateSettingEntity } from './certificate_setting.entity';
import { DeviceBulkUploadProcessor } from './device-bulk-upload.processor';
import { BullModule } from '@nestjs/bull';
import { BulkUploadModule } from '../bulk-upload/bulk-upload.module';
import { BulkUploadEntity } from '../bulk-upload/bulk-uploads.entity';
import { BulkUploadFailedLogEntity } from '../bulk-upload/bulk-uploads-failed-logs.entity';
import { defaultBullJobOptions } from '../../config/bull.config';
import { Queues } from '../../utils/enums/queues.enum';
import { EvidentModule } from '../evident/evident.module';
import { DocumentEntity } from '../document-uploads/entities/documents.entity';
import { CertificateReadModelEntity } from '../../lib/certificates/offchain-certificate/repositories/certificate-read-modal/certificate-read-model.entity';

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
      CertificateSettingEntity,
      BulkUploadEntity,
      BulkUploadFailedLogEntity,
      DocumentEntity,
    ]),
    forwardRef(() => DeviceModule),
    BullModule.registerQueue({
      name: Queues.DeviceBulkUpload,
      defaultJobOptions: defaultBullJobOptions,
    }),
    forwardRef(() => OrganizationModule),
    YieldConfigModule,
    FileModule,
    forwardRef(() => UserModule),
    forwardRef(() => BulkUploadModule),
    forwardRef(() => EvidentModule),
  ],
  providers: [DeviceGroupService, DeviceBulkUploadProcessor],
  exports: [DeviceGroupService, BullModule],
  controllers: [BuyerReservationController],
})
export class DeviceGroupModule {}

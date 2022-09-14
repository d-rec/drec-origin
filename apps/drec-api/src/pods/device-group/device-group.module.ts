import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceModule } from '../device/device.module';
import { DeviceGroupController } from './device-group.controller';
import { DeviceGroup } from './device-group.entity';
import { DeviceGroupService } from './device-group.service';
import { OrganizationModule } from '../organization/organization.module';
import { FileModule } from '../file';
import { DeviceCsvProcessingFailedRowsEntity } from './device_csv_processing_failed_rows.entity';
import { DeviceCsvFileProcessingJobsEntity } from './device_csv_processing_jobs.entity';
import { YieldConfigModule } from '../yield-config/yieldconfig.module';
import {DeviceGroupNextIssueCertificate} from './device_group_issuecertificate.entity';
import {CheckCertificateIssueDateLogForDeviceGroupEntity} from './check_certificate_issue_date_log_for_device_group.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DeviceGroup,
      DeviceCsvFileProcessingJobsEntity,
      DeviceCsvProcessingFailedRowsEntity,
      DeviceGroupNextIssueCertificate,
      CheckCertificateIssueDateLogForDeviceGroupEntity
    ]),
    forwardRef(() => DeviceModule),
    OrganizationModule,
    YieldConfigModule,
    FileModule
  ],
  providers: [DeviceGroupService],
  exports: [DeviceGroupService],
  controllers: [DeviceGroupController],
})
export class DeviceGroupModule {}

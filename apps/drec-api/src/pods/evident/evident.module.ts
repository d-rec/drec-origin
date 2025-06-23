import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { EvidentSettings } from './evident-settings.entity';
import { EvidentSettingsController } from './evident-settings.controller';
import { EvidentSettingsService } from './evident-settings.service';
import { EvidentService } from './evident.service';
import { TrrigerIssuanceRequestForOrganizationsService } from './trigger-Issuance-request-for-organizations';
import { CheckCertificateIssueDateLogForDeviceEntity } from '../device/check_certificate_issue_date_log_for_device.entity';
import { Device } from '../device';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      EvidentSettings,
      Device,
      CheckCertificateIssueDateLogForDeviceEntity,
    ]),
  ],
  controllers: [EvidentSettingsController],
  providers: [
    EvidentSettingsService,
    EvidentService,
    TrrigerIssuanceRequestForOrganizationsService,
  ],
  exports: [EvidentSettingsService],
})
export class EvidentModule {}

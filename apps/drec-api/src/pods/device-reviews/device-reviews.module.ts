import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceReviewsController } from './device-reviews.controller';
import { DeviceReviewsService } from './device-reviews.service';
import { FileModule } from '../file/file.module';
import { UserModule } from '../user/user.module';
import { DocumentUploadsModule } from '../document-uploads/document-uploads.module';
import { OrgApiLicensesModule } from '../org-api-licenses/org-api-licenses.module';
import { SolarYieldModule } from '../solar-yield/solar-yield.module';
import { AiModule } from '../ai/ai.module';
import { VerificationReport } from './verification-report.entity';
import { VerificationReportsService } from './verification-reports.service';
import { FieldProvenanceBackfillService } from './field-provenance-backfill.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([VerificationReport]),
    FileModule,
    DocumentUploadsModule,
    forwardRef(() => UserModule),
    OrgApiLicensesModule,
    SolarYieldModule,
    AiModule,
  ],
  controllers: [DeviceReviewsController],
  providers: [
    DeviceReviewsService,
    VerificationReportsService,
    FieldProvenanceBackfillService,
  ],
  exports: [
    DeviceReviewsService,
    VerificationReportsService,
    FieldProvenanceBackfillService,
  ],
})
export class DeviceReviewsModule {}

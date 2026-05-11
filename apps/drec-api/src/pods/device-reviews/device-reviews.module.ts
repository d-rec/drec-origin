import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceReviewsController } from './device-reviews.controller';
import { DeviceReviewsService } from './device-reviews.service';
import { FileModule } from '../file/file.module';
import { UserModule } from '../user/user.module';
import { DocumentUploadsModule } from '../document-uploads/document-uploads.module';
import { OrgApiLicensesModule } from '../org-api-licenses/org-api-licenses.module';
import { SolarYieldModule } from '../solar-yield/solar-yield.module';
import { VerificationReport } from './verification-report.entity';
import { VerificationReportsService } from './verification-reports.service';
import { DeviceReviewNote } from './device-review-note.entity';
import { DeviceReviewNotesService } from './device-review-notes.service';
import { DeviceReviewNotesController } from './device-review-notes.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([VerificationReport, DeviceReviewNote]),
    FileModule,
    DocumentUploadsModule,
    forwardRef(() => UserModule),
    OrgApiLicensesModule,
    SolarYieldModule,
  ],
  controllers: [DeviceReviewsController, DeviceReviewNotesController],
  providers: [
    DeviceReviewsService,
    VerificationReportsService,
    DeviceReviewNotesService,
  ],
  exports: [
    DeviceReviewsService,
    VerificationReportsService,
    DeviceReviewNotesService,
  ],
})
export class DeviceReviewsModule {}

import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceReviewsController } from './device-reviews.controller';
import { DeviceReviewsService } from './device-reviews.service';
import { FileModule } from '../file/file.module';
import { UserModule } from '../user/user.module';
import { DocumentUploadsModule } from '../document-uploads/document-uploads.module';
import { OrgApiLicensesModule } from '../org-api-licenses/org-api-licenses.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([]),
    FileModule,
    DocumentUploadsModule,
    forwardRef(() => UserModule),
    OrgApiLicensesModule,
  ],
  controllers: [DeviceReviewsController],
  providers: [DeviceReviewsService],
})
export class DeviceReviewsModule {}

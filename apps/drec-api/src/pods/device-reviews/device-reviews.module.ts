import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceReviewsController } from './device-reviews.controller';
import { DeviceReviewsService } from './device-reviews.service';
import { FileModule } from '../file/file.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([]),
    FileModule,
    forwardRef(() => UserModule),
  ],
  controllers: [DeviceReviewsController],
  providers: [DeviceReviewsService],
})
export class DeviceReviewsModule {}

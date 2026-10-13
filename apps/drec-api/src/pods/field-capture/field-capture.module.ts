import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FieldCapture } from './field-capture.entity';
import { Device } from '../device/device.entity';
import { FieldCaptureController } from './field-capture.controller';
import { FieldCaptureService } from './field-capture.service';
import { DeviceModule } from '../device/device.module';
import { FileModule } from '../file/file.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FieldCapture, Device]),
    forwardRef(() => DeviceModule),
    FileModule,
    forwardRef(() => UserModule),
  ],
  controllers: [FieldCaptureController],
  providers: [FieldCaptureService],
  exports: [FieldCaptureService],
})
export class FieldCaptureModule {}

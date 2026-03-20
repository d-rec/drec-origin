import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceSubmissionsController } from './device-submissions.controller';
import { DeviceSubmissionsService } from './device-submissions.service';
import { FileModule } from '../file/file.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([]), FileModule, forwardRef(() => UserModule)],
  controllers: [DeviceSubmissionsController],
  providers: [DeviceSubmissionsService],
})
export class DeviceSubmissionsModule {}

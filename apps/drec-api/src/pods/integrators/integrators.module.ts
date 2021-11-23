import { Module } from '@nestjs/common';
import { DeviceModule } from '../device/device.module';
import { ReadsModule } from '../reads/reads.module';
import { OrganizationModule } from '../organization/organization.module';
import { DeviceGroupModule } from '../device-group/device-group.module';
import { IntegratorsService } from './integrators.service';
import { HttpModule } from '@nestjs/axios';
import { CqrsModule } from '@nestjs/cqrs';

@Module({
  imports: [
    HttpModule,
    CqrsModule,
    DeviceModule,
    DeviceGroupModule,
    ReadsModule,
    OrganizationModule,
  ],
  providers: [IntegratorsService],
  exports: [IntegratorsService],
})
export class IntegratorsModule {}

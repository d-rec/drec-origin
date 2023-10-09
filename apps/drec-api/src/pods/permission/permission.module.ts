import { Module,Global } from '@nestjs/common';
import { PermissionController } from './permission.controller';
import { PermissionService } from './permission.service';
import {ACLModulePermissions} from './permission.entity'
import { TypeOrmModule } from '@nestjs/typeorm';
import { DecimalPermissionValue } from '../access-control-layer-module-service/common/permissionBitposition';
import {AccessControlLayerModuleServiceModule} from '../access-control-layer-module-service/access-control-layer-module-service.module'
import {UserModule} from '../user/user.module'
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([ACLModulePermissions]),AccessControlLayerModuleServiceModule,UserModule],
  controllers: [PermissionController],
  providers: [PermissionService,DecimalPermissionValue],
  exports: [PermissionService]
})
export class PermissionModule {}

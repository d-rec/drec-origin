import { Module } from '@nestjs/common';
import {AClModules} from './aclmodule.entity'
import {DecimalPermissionValue} from './common/permissionBitposition';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessControlLayerModuleServiceController } from './access-control-layer-module-service.controller';
import {AccessControlLayerModuleServiceService} from './access-control-layer-module-service.service';
@Module({
    imports: [TypeOrmModule.forFeature([AClModules])],
    providers: [AccessControlLayerModuleServiceService,DecimalPermissionValue],
    controllers: [ AccessControlLayerModuleServiceController],
    exports: [AccessControlLayerModuleServiceService]

})
export class AccessControlLayerModuleServiceModule {}

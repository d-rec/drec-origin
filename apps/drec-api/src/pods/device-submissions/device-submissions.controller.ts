import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DeviceSubmissionsService, AssetDto } from './device-submissions.service';
import { AuthVerifiedGuard, PermissionGuard } from '../../guards';
import { Permission } from '../permission/decorators/permission.decorator';
import { ACLModules } from '../access-control-layer-module-service/decorator/aclModule.decorator';

@ApiTags('Device Submissions')
@ApiBearerAuth('access-token')
@Controller('device-submissions')
export class DeviceSubmissionsController {
  constructor(private readonly service: DeviceSubmissionsService) {}

  @Get()
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Read')
  @ACLModules('DEVICE_SUBMISSIONS_MANAGEMENT_CRUDL')
  @ApiOperation({ summary: 'List all devices with their submission documents and signed S3 URLs' })
  @ApiResponse({ status: 200, description: 'Array of device assets with document URLs' })
  findAll(): Promise<AssetDto[]> {
    return this.service.findAll();
  }
}

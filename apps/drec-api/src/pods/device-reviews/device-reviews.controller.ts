import { Controller, Get, Param, ParseIntPipe, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DeviceReviewsService, AssetDto } from './device-reviews.service';
import { AuthVerifiedGuard, PermissionGuard } from '../../guards';
import { Permission } from '../permission/decorators/permission.decorator';
import { ACLModules } from '../access-control-layer-module-service/decorator/aclModule.decorator';

@ApiTags('Device Reviews')
@ApiBearerAuth('access-token')
@Controller('device-reviews')
export class DeviceReviewsController {
  constructor(private readonly service: DeviceReviewsService) {}

  @Get()
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Read')
  @ACLModules('DEVICE_REVIEWS_MANAGEMENT_CRUDL')
  @ApiOperation({ summary: 'List all devices with their submission documents and signed S3 URLs' })
  @ApiResponse({ status: 200, description: 'Array of device assets with document URLs' })
  findAll(): Promise<AssetDto[]> {
    return this.service.findAll();
  }

  @Patch('documents/:id/reviewed')
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Write')
  @ACLModules('DEVICE_REVIEWS_MANAGEMENT_CRUDL')
  @ApiOperation({ summary: 'Toggle the reviewed flag on a document' })
  @ApiResponse({ status: 200, description: 'New reviewed state' })
  toggleReviewed(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ reviewed: boolean }> {
    return this.service.toggleReviewedFlag(id);
  }
}

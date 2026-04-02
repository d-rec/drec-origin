import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DeviceReviewsService, AssetDto } from './device-reviews.service';
import { DocumentUploadsService } from '../document-uploads/document-uploads.service';
import {
  DocumentType,
  DocumentTargetType,
} from '../document-uploads/entities/documents.entity';
import { AuthVerifiedGuard, PermissionGuard } from '../../guards';
import { Permission } from '../permission/decorators/permission.decorator';
import { ACLModules } from '../access-control-layer-module-service/decorator/aclModule.decorator';

@ApiTags('Device Reviews')
@ApiBearerAuth('access-token')
@Controller('device-reviews')
export class DeviceReviewsController {
  constructor(
    private readonly service: DeviceReviewsService,
    private readonly documentUploadsService: DocumentUploadsService,
  ) {}

  @Get()
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Read')
  @ACLModules('DEVICE_REVIEWS_MANAGEMENT_CRUDL')
  @ApiOperation({
    summary:
      'List all devices with their submission documents and signed S3 URLs',
  })
  @ApiResponse({
    status: 200,
    description: 'Array of device assets with document URLs',
  })
  findAll(): Promise<AssetDto[]> {
    return this.service.findAll();
  }

  @Get('meter-reads')
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Read')
  @ACLModules('DEVICE_REVIEWS_MANAGEMENT_CRUDL')
  @ApiOperation({
    summary: 'List devices with meter reads grouped by device for review',
  })
  @ApiResponse({ status: 200, description: 'Array of devices with read stats' })
  findAllMeterReadReviews(): Promise<any[]> {
    return this.service.findAllMeterReadReviews();
  }

  @Patch('meter-reads/:deviceId/status')
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Write')
  @ACLModules('DEVICE_REVIEWS_MANAGEMENT_CRUDL')
  @ApiOperation({ summary: 'Update meter-read review status for a device' })
  @ApiResponse({ status: 200, description: 'Updated review status' })
  updateMeterReadReviewStatus(
    @Param('deviceId', ParseIntPipe) deviceId: number,
    @Body() body: { status: string; notes?: string; reviewer?: string },
    @Req() req: Request,
  ): Promise<{ status: string }> {
    return this.service.updateMeterReadReviewStatus(
      deviceId,
      body.status,
      body.notes,
      body.reviewer,
      req.ip,
    );
  }

  @Post('detect-panels')
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Read')
  @ACLModules('DEVICE_REVIEWS_MANAGEMENT_CRUDL')
  @ApiOperation({ summary: 'Proxy solar panel detection to Roboflow' })
  @ApiResponse({ status: 200, description: 'Roboflow detection results' })
  detectPanels(@Body('image') image: string): Promise<any> {
    return this.service.detectPanels(image);
  }

  @Patch(':deviceId/status')
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Write')
  @ACLModules('DEVICE_REVIEWS_MANAGEMENT_CRUDL')
  @ApiOperation({ summary: 'Update review status for a device' })
  @ApiResponse({ status: 200, description: 'Updated status' })
  updateStatus(
    @Param('deviceId', ParseIntPipe) deviceId: number,
    @Body('status') status: string,
    @Req() req: Request,
  ): Promise<{ status: string }> {
    return this.service.updateReviewStatus(deviceId, status, req.ip);
  }

  @Post('refresh-url')
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Read')
  @ACLModules('DEVICE_REVIEWS_MANAGEMENT_CRUDL')
  @ApiOperation({ summary: 'Get a fresh signed S3 URL for a document key' })
  @ApiResponse({ status: 200, description: 'Fresh signed URL' })
  refreshUrl(@Body('key') key: string): Promise<{ url: string }> {
    return this.service.refreshSignedUrl(key);
  }

  @Delete('documents/:id')
  @HttpCode(204)
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Write')
  @ACLModules('DEVICE_REVIEWS_MANAGEMENT_CRUDL')
  @ApiOperation({ summary: 'Delete a document from DB and S3' })
  @ApiResponse({ status: 204, description: 'Document deleted' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async deleteDocument(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.service.deleteDocument(id);
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

  @Post(':deviceId/documents')
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Write')
  @ACLModules('DEVICE_REVIEWS_MANAGEMENT_CRUDL')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a document for a device' })
  @ApiResponse({ status: 201, description: 'Document uploaded' })
  async uploadDocument(
    @Param('deviceId', ParseIntPipe) deviceId: number,
    @Body('type') type: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<any> {
    await this.service.assertNotApproved(deviceId);
    const projectName = await this.service.getProjectName(deviceId);
    const subfolder = (projectName || 'project')
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .toLowerCase();
    const projectSubfolder = `${subfolder}-${deviceId}`;
    return this.documentUploadsService.upload(
      deviceId,
      DocumentTargetType.DEVICE,
      type as DocumentType,
      file,
      projectSubfolder,
    );
  }

  @Get(':deviceId/audit-trail')
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Read')
  @ACLModules('DEVICE_REVIEWS_MANAGEMENT_CRUDL')
  @ApiOperation({
    summary: 'Get the full audit trail for a device',
    description:
      'D-REC §3.8: Returns the immutable log of all verification actions taken on this device.',
  })
  @ApiResponse({ status: 200, description: 'Audit trail entries' })
  getAuditTrail(
    @Param('deviceId', ParseIntPipe) deviceId: number,
  ): Promise<any> {
    return this.service.getAuditTrail(deviceId);
  }

  @Get(':deviceId/duplicates')
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Read')
  @ACLModules('DEVICE_REVIEWS_MANAGEMENT_CRUDL')
  @ApiOperation({
    summary: 'Screen device for potential duplicates across all organizations',
    description:
      'D-REC §2.6: Checks coordinate proximity (<100m), cross-org serial number, and fingerprint matches.',
  })
  @ApiResponse({ status: 200, description: 'Duplicate screening results' })
  screenForDuplicates(
    @Param('deviceId', ParseIntPipe) deviceId: number,
  ): Promise<any> {
    return this.service.screenForDuplicates(deviceId);
  }

  @Get(':deviceId/ownership')
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Read')
  @ACLModules('DEVICE_REVIEWS_MANAGEMENT_CRUDL')
  @ApiOperation({
    summary: 'Verify device ownership documents',
    description:
      'D-REC §2.7: Checks SF-02C and SF-02 documents exist and returns ownership verification status.',
  })
  @ApiResponse({ status: 200, description: 'Ownership verification result' })
  verifyOwnership(
    @Param('deviceId', ParseIntPipe) deviceId: number,
  ): Promise<any> {
    return this.service.verifyOwnership(deviceId);
  }

  @Patch(':deviceId/ownership')
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Write')
  @ACLModules('DEVICE_REVIEWS_MANAGEMENT_CRUDL')
  @ApiOperation({
    summary: 'Manually set device ownership status',
    description:
      'Allows a reviewer to override ownership status (verified, flagged, unverified).',
  })
  @ApiResponse({ status: 200, description: 'Updated ownership status' })
  updateOwnershipStatus(
    @Param('deviceId', ParseIntPipe) deviceId: number,
    @Body('ownershipStatus') status: string,
  ): Promise<any> {
    return this.service.updateOwnershipStatus(deviceId, status as any);
  }

  @Post(':deviceId/classify-pathway')
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Write')
  @ACLModules('DEVICE_REVIEWS_MANAGEMENT_CRUDL')
  @ApiOperation({
    summary: 'Classify device evidence pathway',
    description:
      'D-REC §3.1: Derives the formal evidence pathway from operating configuration + source-access mode, persists it, and returns combined requirements.',
  })
  @ApiResponse({
    status: 200,
    description: 'Evidence pathway classification and combined requirements',
  })
  classifyPathway(
    @Param('deviceId', ParseIntPipe) deviceId: number,
  ): Promise<any> {
    return this.service.classifyDevicePathway(deviceId);
  }

  @Get(':deviceId/historical-consistency')
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Read')
  @ACLModules('DEVICE_REVIEWS_MANAGEMENT_CRUDL')
  @ApiOperation({
    summary: 'Review historical consistency of production data',
    description:
      'D-REC §3.7: Analyses meter readings for anomalies — flat-lines, spikes, zero gaps, negative values, and excessive variance.',
  })
  @ApiResponse({
    status: 200,
    description: 'Historical consistency review results',
  })
  reviewHistoricalConsistency(
    @Param('deviceId', ParseIntPipe) deviceId: number,
  ): Promise<any> {
    return this.service.reviewHistoricalConsistency(deviceId);
  }

  @Get(':deviceId/production-ceiling')
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Read')
  @ACLModules('DEVICE_REVIEWS_MANAGEMENT_CRUDL')
  @ApiOperation({
    summary: 'Check irradiance-based production ceiling for a device',
    description:
      'D-REC §3.6: Estimates solar yield from device location, compares with configured yield, and checks recent meter readings against the ceiling.',
  })
  @ApiResponse({
    status: 200,
    description: 'Production ceiling check results',
  })
  checkProductionCeiling(
    @Param('deviceId', ParseIntPipe) deviceId: number,
  ): Promise<any> {
    return this.service.checkProductionCeiling(deviceId);
  }

  @Get(':deviceId/compensating-controls')
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Read')
  @ACLModules('DEVICE_REVIEWS_MANAGEMENT_CRUDL')
  @ApiOperation({
    summary: 'Evaluate compensating controls for a Mode 4 device',
    description:
      'D-REC §3.9: Checks whether all compensating controls are satisfied for Mode 4 (lowest data trust) devices.',
  })
  @ApiResponse({
    status: 200,
    description: 'Compensating controls evaluation results',
  })
  evaluateCompensatingControls(
    @Param('deviceId', ParseIntPipe) deviceId: number,
  ): Promise<any> {
    return this.service.evaluateCompensatingControls(deviceId);
  }

  @Get(':deviceId/cross-source')
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Read')
  @ACLModules('DEVICE_REVIEWS_MANAGEMENT_CRUDL')
  @ApiOperation({
    summary: 'Cross-source verification of production data',
    description:
      'D-REC §3.10: Compares actual meter readings against irradiance-modeled production using a regression-based Performance Factor.',
  })
  @ApiResponse({
    status: 200,
    description: 'Cross-source verification results with PF, R², and flags',
  })
  crossSourceVerification(
    @Param('deviceId', ParseIntPipe) deviceId: number,
  ): Promise<any> {
    return this.service.crossSourceVerification(deviceId);
  }

  @Get(':deviceId/source-access-verify')
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Read')
  @ACLModules('DEVICE_REVIEWS_MANAGEMENT_CRUDL')
  @ApiOperation({
    summary: 'Verify source-access mode requirements for a device',
    description:
      'D-REC §3.3: Returns mode-specific document requirements, missing documents, and manual checks the reviewer must confirm.',
  })
  @ApiResponse({
    status: 200,
    description: 'Source-access mode verification results',
  })
  verifySourceAccessMode(
    @Param('deviceId', ParseIntPipe) deviceId: number,
  ): Promise<any> {
    return this.service.verifySourceAccessMode(deviceId);
  }
}

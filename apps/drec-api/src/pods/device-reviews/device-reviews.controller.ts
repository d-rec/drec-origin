import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseFloatPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
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
import { UploadLogService } from '../upload-log/upload-log.service';
import { UploadActionType } from '../upload-log/upload-log.entity';
import { UserDecorator } from '../user/decorators/user.decorator';
import { ILoggedInUser } from '../../models';
import {
  DocumentType,
  DocumentTargetType,
} from '../document-uploads/entities/documents.entity';
import { AuthVerifiedGuard, PermissionGuard } from '../../guards';
import { RolesGuard } from '../../guards/RolesGuard';
import { Roles } from '../user/decorators/roles.decorator';
import { Role } from '../../utils/enums/role.enum';
import { Permission } from '../permission/decorators/permission.decorator';
import { ACLModules } from '../access-control-layer-module-service/decorator/aclModule.decorator';
import { ApiKeyResolverService } from '../org-api-licenses/api-key-resolver.service';
import { VerificationReportsService } from './verification-reports.service';

@ApiTags('Device Reviews')
@ApiBearerAuth('access-token')
@Controller('device-reviews')
export class DeviceReviewsController {
  constructor(
    private readonly service: DeviceReviewsService,
    private readonly documentUploadsService: DocumentUploadsService,
    private readonly uploadLogService: UploadLogService,
    private readonly apiKeyResolver: ApiKeyResolverService,
    private readonly verificationReportsService: VerificationReportsService,
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

  @Get('meter-reads/:deviceId/reads')
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Read')
  @ACLModules('DEVICE_REVIEWS_MANAGEMENT_CRUDL')
  @ApiOperation({ summary: 'Get individual meter reads for a device' })
  @ApiResponse({ status: 200, description: 'Array of meter reads' })
  findMeterReadsForDevice(
    @Param('deviceId', ParseIntPipe) deviceId: number,
  ): Promise<any[]> {
    return this.service.findMeterReadsForDevice(deviceId);
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

  @Post('meter-reads/:deviceId/flag-read')
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Write')
  @ACLModules('DEVICE_REVIEWS_MANAGEMENT_CRUDL')
  @ApiOperation({ summary: 'Flag an individual meter read as anomalous' })
  @ApiResponse({ status: 201, description: 'Anomaly flagged and audit logged' })
  flagMeterRead(
    @Param('deviceId', ParseIntPipe) deviceId: number,
    @Body() body: { readId: number; reason: string; reviewer?: string },
    @Req() req: Request,
  ): Promise<{ logged: boolean }> {
    return this.service.flagMeterRead(deviceId, body.readId, body.reason, body.reviewer, req.ip);
  }

  @Post('meter-reads/:deviceId/gap-analysis')
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Read')
  @ACLModules('DEVICE_REVIEWS_MANAGEMENT_CRUDL')
  @ApiOperation({ summary: 'Analyse meter read gaps for a device' })
  @ApiResponse({ status: 200, description: 'Gap analysis results' })
  meterReadGapAnalysis(
    @Param('deviceId', ParseIntPipe) deviceId: number,
    @Req() req: Request,
  ): Promise<any> {
    return this.service.meterReadGapAnalysis(deviceId, req.ip);
  }

  @Patch('meter-reads/bulk/status')
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Write')
  @ACLModules('DEVICE_REVIEWS_MANAGEMENT_CRUDL')
  @ApiOperation({ summary: 'Bulk update meter-read review status' })
  @ApiResponse({ status: 200, description: 'Results per device' })
  bulkUpdateMeterReadStatus(
    @Body() body: { deviceIds: number[]; status: string; reviewer?: string },
    @Req() req: Request,
  ): Promise<Array<{ deviceId: number; status: string; error?: string }>> {
    return this.service.bulkUpdateMeterReadReviewStatus(
      body.deviceIds,
      body.status,
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
  async detectPanels(
    @UserDecorator() user: ILoggedInUser,
    @Body('image') image: string,
  ): Promise<any> {
    const { url, key } = await this.apiKeyResolver.resolveRoboflowKey(user);
    return this.service.detectPanels(image, url, key);
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

  @Patch('bulk/status')
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Write')
  @ACLModules('DEVICE_REVIEWS_MANAGEMENT_CRUDL')
  @ApiOperation({ summary: 'Bulk update review status for multiple devices' })
  @ApiResponse({ status: 200, description: 'Results per device' })
  bulkUpdateStatus(
    @Body('deviceIds') deviceIds: number[],
    @Body('status') status: string,
    @Req() req: Request,
  ): Promise<Array<{ deviceId: number; status: string; error?: string }>> {
    return this.service.bulkUpdateReviewStatus(deviceIds, status, req.ip);
  }

  @Post('bulk/auto-screen')
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Read')
  @ACLModules('DEVICE_REVIEWS_MANAGEMENT_CRUDL')
  @ApiOperation({ summary: 'Run auto-screen on multiple devices (or all unscreened)' })
  @ApiResponse({ status: 200, description: 'Screen results per device' })
  bulkAutoScreen(
    @Body('deviceIds') deviceIds?: number[],
  ): Promise<Array<{ deviceId: number; overallStatus: string; error?: string }>> {
    return this.service.bulkAutoScreen(deviceIds);
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
    @UserDecorator() user: ILoggedInUser,
    @Req() req: Request,
  ): Promise<any> {
    await this.service.assertNotApproved(deviceId);
    const siteName = await this.service.getSiteName(deviceId);
    const subfolder = (siteName || 'project')
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .toLowerCase();
    const projectSubfolder = `${subfolder}-${deviceId}`;
    const result = await this.documentUploadsService.upload(
      deviceId,
      DocumentTargetType.DEVICE,
      type as DocumentType,
      file,
      projectSubfolder,
    );
    this.uploadLogService.logFileUpload({
      deviceId,
      userId: user.id,
      userEmail: user.email,
      organizationId: user.organizationId,
      actionType: UploadActionType.DocumentUpload,
      fileName: file.originalname,
      fileBuffer: file.buffer,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { documentType: type },
    });
    return result;
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

  @Get(':deviceId/auto-screen')
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Read')
  @ACLModules('DEVICE_REVIEWS_MANAGEMENT_CRUDL')
  @ApiOperation({
    summary: 'Run all verification checks and produce a screening report',
    description:
      'D-REC VA layer: Aggregates ownership, duplicates, source-access, consistency, ceiling, cross-source, photo GPS, and compensating controls into one report.',
  })
  @ApiResponse({ status: 200, description: 'Auto-screen report' })
  autoScreen(
    @Param('deviceId', ParseIntPipe) deviceId: number,
  ): Promise<any> {
    return this.service.autoScreenReport(deviceId);
  }

  @Get(':deviceId/sld-compare')
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Read')
  @ACLModules('DEVICE_REVIEWS_MANAGEMENT_CRUDL')
  @ApiOperation({
    summary: 'Compare SLD-stated capacity against registered capacity',
    description:
      'D-REC VA layer: Returns the SLD capacity entered by the reviewer vs the device registered capacity, flagging ±10% mismatches.',
  })
  @ApiResponse({ status: 200, description: 'SLD capacity comparison' })
  compareSldCapacity(
    @Param('deviceId', ParseIntPipe) deviceId: number,
  ): Promise<any> {
    return this.service.compareSldCapacity(deviceId);
  }

  @Patch(':deviceId/sld-capacity')
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Write')
  @ACLModules('DEVICE_REVIEWS_MANAGEMENT_CRUDL')
  @ApiOperation({
    summary: 'Set the SLD-stated capacity (kW) for a device',
    description:
      'Reviewer enters the kW value read from the Single Line Diagram.',
  })
  @ApiResponse({ status: 200, description: 'SLD capacity saved' })
  setSldCapacity(
    @Param('deviceId', ParseIntPipe) deviceId: number,
    @Body('sldCapacityKw') sldCapacityKw: number,
  ): Promise<any> {
    return this.service.setSldCapacity(deviceId, sldCapacityKw);
  }

  @Get(':deviceId/photo-gps')
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Read')
  @ACLModules('DEVICE_REVIEWS_MANAGEMENT_CRUDL')
  @ApiOperation({
    summary: 'Verify GPS coordinates in project photos via EXIF',
    description:
      'D-REC VA layer: Downloads project photos from S3, extracts EXIF GPS data, and checks each photo is within 300m of the declared device location.',
  })
  @ApiResponse({ status: 200, description: 'Photo GPS verification results' })
  verifyPhotoGps(
    @Param('deviceId', ParseIntPipe) deviceId: number,
  ): Promise<any> {
    return this.service.verifyPhotoGps(deviceId);
  }

  @Get(':deviceId/country-match')
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Read')
  @ACLModules('DEVICE_REVIEWS_MANAGEMENT_CRUDL')
  @ApiOperation({
    summary: 'Verify declared country against lat/lng via reverse-geocode',
    description:
      'Reverse-geocodes the device coordinates and compares to the declared country. Points inside curated disputed-territory polygons are never auto-rejected — they are surfaced for reviewer judgment with both claims shown.',
  })
  @ApiResponse({ status: 200, description: 'Country match verification result' })
  verifyCountryMatch(
    @Param('deviceId', ParseIntPipe) deviceId: number,
  ): Promise<any> {
    return this.service.verifyCountryMatch(deviceId);
  }

  @Post(':deviceId/coords-confirmed')
  @UseGuards(AuthVerifiedGuard('jwt'), RolesGuard, PermissionGuard)
  @Roles(Role.Admin, Role.Registrant)
  @Permission('Write')
  @ACLModules('DEVICE_REVIEWS_MANAGEMENT_CRUDL')
  @ApiOperation({
    summary: 'Record a successful Roboflow panel detection at the device coords',
    description:
      'Persists the lat/lng + panel count + timestamp on the device row so the auto-screen ≥6-decimal precision check can pass when visual confirmation succeeded. Registrant-only — reviewers never write device state.',
  })
  @ApiResponse({ status: 200, description: 'Confirmation recorded' })
  confirmCoords(
    @Param('deviceId', ParseIntPipe) deviceId: number,
    @Body() body: { lat: number; lng: number; panelCount: number },
  ): Promise<void> {
    return this.service.confirmCoords(
      deviceId,
      body.lat,
      body.lng,
      body.panelCount,
    );
  }

  @Post(':deviceId/generate-sf02')
  @UseGuards(AuthVerifiedGuard('jwt'), RolesGuard, PermissionGuard)
  @Roles(Role.Admin, Role.Registrant)
  @Permission('Write')
  @ACLModules('DEVICE_REVIEWS_MANAGEMENT_CRUDL')
  @ApiOperation({
    summary: 'Generate an SF-02 (Production Facility Registration) PDF',
    description:
      'Creates a PDF registration form from device data, uploads it to S3, and saves it as a FORM_SF_02 document. Reviewer roles are excluded — the canonical SF-02 is owned by the registrant; reviewers read it but never create it. Auto-regen on device PATCH keeps it in sync.',
  })
  @ApiResponse({ status: 201, description: 'Generated SF-02 URL and document ID' })
  generateSf02(
    @Param('deviceId', ParseIntPipe) deviceId: number,
  ): Promise<{ url: string; docId: number }> {
    return this.service.generateSf02(deviceId);
  }

  @Get('satellite-date')
  @UseGuards(AuthVerifiedGuard(['jwt', 'oauth2-client-password']))
  @ApiOperation({
    summary: 'Get most recent satellite image date for coordinates',
    description:
      'Queries the Sentinel-2 catalog for the most recent low-cloud image at the given lat/lng.',
  })
  async getSatelliteDate(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lng', ParseFloatPipe) lng: number,
  ): Promise<{ date: string | null; cloudCover: number | null }> {
    try {
      const resp = await fetch(
        'https://earth-search.aws.element84.com/v1/search',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            collections: ['sentinel-2-l2a'],
            intersects: { type: 'Point', coordinates: [lng, lat] },
            limit: 1,
            sortby: [{ field: 'properties.datetime', direction: 'desc' }],
            query: { 'eo:cloud_cover': { lte: 15 } },
          }),
        },
      );
      const data = await resp.json();
      const feature = data?.features?.[0];
      if (!feature) return { date: null, cloudCover: null };
      return {
        date: feature.properties.datetime,
        cloudCover: feature.properties['eo:cloud_cover'],
      };
    } catch {
      return { date: null, cloudCover: null };
    }
  }

  // ── Verification Reports ─────────────────────────────────────────────
  // Persist a Verify Device run so a reviewer can share a stable URL with
  // the registrant. Registrants can fetch by id (read-only).

  @Post(':deviceId/reports')
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Write')
  @ACLModules('DEVICE_REVIEWS_MANAGEMENT_CRUDL')
  @ApiOperation({ summary: 'Save a Verify Device report' })
  async saveVerificationReport(
    @UserDecorator() user: ILoggedInUser,
    @Param('deviceId', ParseIntPipe) deviceId: number,
    @Body()
    body: {
      elapsedMs?: number;
      overallStatus?: string;
      payload: any;
    },
  ): Promise<{ id: number; uuid: string }> {
    const saved = await this.verificationReportsService.create(
      deviceId,
      user.email,
      null,
      body.elapsedMs ?? 0,
      body.overallStatus ?? null,
      body.payload || {},
    );
    return { id: saved.id, uuid: saved.uuid };
  }

  @Get('reports/:ref')
  @ApiOperation({
    summary: 'Fetch a Verify Device report by uuid (or legacy integer id)',
    description:
      'Public so registrants can open the URL the reviewer shares via chat without needing to authenticate. Accepts either the uuid (preferred, used in shared links) or the integer id (legacy).',
  })
  async getVerificationReport(@Param('ref') ref: string): Promise<any> {
    return this.verificationReportsService.findByRef(ref);
  }

  @Get(':deviceId/reports')
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Read')
  @ACLModules('DEVICE_REVIEWS_MANAGEMENT_CRUDL')
  @ApiOperation({ summary: 'List recent Verify Device reports for a device' })
  async listVerificationReports(
    @Param('deviceId', ParseIntPipe) deviceId: number,
  ): Promise<any[]> {
    return this.verificationReportsService.listForDevice(deviceId);
  }
}

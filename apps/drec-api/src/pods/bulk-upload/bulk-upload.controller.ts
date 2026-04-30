import {
  BadRequestException,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpStatus,
  Logger,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import multer from 'multer';
import { BulkUploadService } from './bulk-upload.service';
import { ACLModules } from '../access-control-layer-module-service/decorator/aclModule.decorator';
import { BulkUploadEntity, BulkUploadType } from './bulk-uploads.entity';
import { ILoggedInUser } from '../../models';
import { GetBulkUploadDTO } from './dto/get-bulk-upload.dto';
import { OrganizationService } from '../organization/organization.service';
import { FileService } from '../file';
import { MeterReadFileDto } from '../reads/dto/meter-read-file.dto';
import { Permission } from '../permission/decorators/permission.decorator';
import { PermissionGuard } from '../../guards/PermissionGuard';
import { UserDecorator } from '../user/decorators/user.decorator';
import { Role } from '../../utils/enums/role.enum';
import { Roles } from '../user/decorators/roles.decorator';
import { OrganizationType } from '../../utils/enums/organization-type.enum';
import { Request } from 'express';
import { AuthVerifiedGuard } from '../../guards';
import { UploadLogService } from '../upload-log/upload-log.service';
import { UploadActionType } from '../upload-log/upload-log.entity';

@Controller('bulk-upload')
@ApiBearerAuth('access-token')
@ApiTags('Bulk Upload')
export class BulkUploadController {
  private readonly logger = new Logger(BulkUploadController.name);
  constructor(
    private readonly bulkUploadService: BulkUploadService,
    private readonly organizationService: OrganizationService,
    private readonly fileService: FileService,
    private readonly uploadLogService: UploadLogService,
  ) {}

  @Post()
  @UseGuards(AuthVerifiedGuard())
  @Permission('Write')
  @ACLModules('READS_MANAGEMENT_CRUDL')
  @ACLModules('ORGANIZATION_MANAGEMENT_CRUDL')
  @ACLModules('DEVICE_BULK_MANAGEMENT_CRUDL')
  @Roles(Role.Admin, Role.SiteOperator, Role.Registrant)
  @ApiSecurity('bearer')
  @ApiConsumes('multipart/form-data')
  @ApiQuery({
    name: 'organizationId',
    required: true,
    type: 'number',
  })
  @ApiQuery({
    name: 'bulkUploadType',
    required: true,
    enum: BulkUploadType,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
      fileFilter: (req, file, callback) => {
        const isCSV = file.originalname.endsWith('.csv');
        if (!isCSV) {
          return callback(
            new BadRequestException(
              'Invalid file type. Only .csv files are allowed.',
            ),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  @ApiOperation({
    summary: 'Upload bulk data',
    description:
      'Uploads a bulk file for processing. The file must be in CSV format. This endpoint requires a valid organization ID and a valid bulk upload type.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: BulkUploadEntity,
    description:
      'Successfully uploaded the bulk file and created a new upload job.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'No file provided or invalid file type. Only .csv files are allowed.',
  })
  async upload(
    @UploadedFile() file: MeterReadFileDto,
    @UserDecorator() user: ILoggedInUser,
    @Query('organizationId') organizationIdParam: number | null,
    @Query('bulkUploadType') bulkUploadType: BulkUploadType,
    @Req() req: Request,
  ): Promise<BulkUploadEntity> {
    console.log('[BULK-UPLOAD] handler entered', {
      userId: user?.id,
      userEmail: user?.email,
      userOrgId: user?.organizationId,
      organizationIdParam,
      bulkUploadType,
      fileName: file?.originalname,
      fileSize: file?.buffer?.length,
    });
    if (!file) {
      console.log('[BULK-UPLOAD] no file, throwing');
      throw new BadRequestException('No file provided');
    }

    const organizationId = organizationIdParam || user.organizationId;
    console.log('[BULK-UPLOAD] resolved organizationId', organizationId);

    const organization = await this.organizationService.findOne(organizationId);
    console.log(
      '[BULK-UPLOAD] org found',
      organization?.id,
      organization?.organizationType,
    );
    if (organization.organizationType !== OrganizationType.Registrant) {
      console.log('[BULK-UPLOAD] org not Registrant, rejecting');
      throw new UnauthorizedException(
        'Only Market Intermediary organizations can upload bulk files',
      );
    }

    await this.organizationService.checkIfCanManage({
      user,
      organizationId,
    });
    console.log('[BULK-UPLOAD] checkIfCanManage passed');

    const [fileId] = await this.fileService.store(user, [file]);
    console.log('[BULK-UPLOAD] file stored, id=', fileId);

    this.uploadLogService.logFileUpload({
      userId: user.id,
      userEmail: user.email,
      organizationId,
      actionType: UploadActionType.MeterReadUpload,
      fileName: file.originalname,
      fileBuffer: file.buffer,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { bulkUploadType },
    });

    const job = await this.bulkUploadService.storeBulkUploadJob(
      fileId,
      user,
      organizationId,
      bulkUploadType,
    );
    console.log(
      '[BULK-UPLOAD] job created, id=',
      job?.id,
      'jobId=',
      (job as any)?.jobId,
    );
    return job;
  }

  @Get()
  @UseGuards(
    AuthVerifiedGuard(['jwt', 'oauth2-client-password']),
    PermissionGuard,
  )
  @Permission('Read')
  @ACLModules('READS_MANAGEMENT_CRUDL')
  @ACLModules('DEVICE_BULK_MANAGEMENT_CRUDL')
  @Roles(Role.Admin, Role.SiteOperator, Role.Registrant)
  @ApiSecurity('bearer')
  @ApiQuery({
    name: 'bulkUploadType',
    required: true,
    enum: BulkUploadType,
  })
  @ApiQuery({ name: 'pageNumber', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiOperation({
    summary: 'Get all bulk upload jobs',
    description:
      'Retrieves all bulk upload jobs for the authenticated user, filtered by upload type and paginated.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [BulkUploadEntity],
    description: 'Successfully retrieved the list of bulk upload jobs.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden. User does not have the required permissions.',
  })
  public async getAll(
    @UserDecorator() user: ILoggedInUser,
    @Query('bulkUploadType', new DefaultValuePipe(null))
    bulkUploadType: BulkUploadType,
    @Query('pageNumber', new DefaultValuePipe(1), ParseIntPipe)
    pageNumber: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<{
    bulkUploadJobs: Array<BulkUploadEntity>;
    currentPage: number;
    totalPages: number;
    totalCount: number;
  }> {
    this.logger.verbose(
      `Fetching bulk upload jobs for user with role: ${user.role}`,
    );

    return await this.bulkUploadService.getBulkUploadJobsByRole(
      user,
      bulkUploadType,
      pageNumber,
      limit,
    );
  }

  @Delete()
  @UseGuards(
    AuthVerifiedGuard(['jwt', 'oauth2-client-password']),
    PermissionGuard,
  )
  @Permission('Delete')
  @ACLModules('READS_MANAGEMENT_CRUDL')
  @ACLModules('DEVICE_BULK_MANAGEMENT_CRUDL')
  @Roles(Role.Admin, Role.SiteOperator, Role.Registrant)
  @ApiSecurity('bearer')
  @ApiQuery({
    name: 'bulkUploadType',
    required: true,
    enum: BulkUploadType,
  })
  @ApiOperation({
    summary: 'Clear bulk upload history',
    description:
      'Deletes all Completed/Failed bulk upload job records (and their failed-row logs) visible to the current user for the given type. Jobs still in progress are left untouched.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Number of records deleted.',
  })
  public async clearHistory(
    @UserDecorator() user: ILoggedInUser,
    @Query('bulkUploadType') bulkUploadType: BulkUploadType,
  ): Promise<{ deleted: number }> {
    return this.bulkUploadService.clearBulkUploadHistoryByRole(
      user,
      bulkUploadType,
    );
  }

  @Get('/bulk-upload-log/:bulkUploadId')
  @UseGuards(
    AuthVerifiedGuard(['jwt', 'oauth2-client-password']),
    PermissionGuard,
  )
  @Permission('Read')
  @ACLModules('READS_MANAGEMENT_CRUDL')
  @ApiQuery({
    name: 'organizationId',
    type: Number,
    required: false,
    description: 'This query parameter is used for Registrant',
  })
  @ApiOperation({
    summary: 'Get bulk upload job status',
    description:
      'Retrieves the status of a specific bulk upload job by its ID. This endpoint is restricted to users with appropriate permissions.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: GetBulkUploadDTO,
    description:
      'Successfully retrieved the status of the specified bulk upload job.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No bulk upload job found with the specified bulk upload ID.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden. User does not have the required permissions.',
  })
  public async getJob(
    @Param('bulkUploadId') bulkUploadId: string,
    @UserDecorator() user: ILoggedInUser,
    @Query('organizationId', new DefaultValuePipe(null))
    organizationId: number | null,
  ): Promise<GetBulkUploadDTO | undefined> {
    this.logger.verbose(`With in getBulkUploadJobStatus`);
    await this.bulkUploadService.canManageBulkUploadJobs({
      user: user,
      organizationId: organizationId,
    });
    return await this.bulkUploadService.getBulkUploadFailedLog(bulkUploadId);
  }

  @Get('/:bulkUploadId/preview')
  @UseGuards(
    AuthVerifiedGuard(['jwt', 'oauth2-client-password']),
    PermissionGuard,
  )
  @Permission('Read')
  @ACLModules('DEVICE_BULK_MANAGEMENT_CRUDL')
  @Roles(Role.Admin, Role.SiteOperator, Role.Registrant)
  @ApiOperation({
    summary: 'Fetch staged bulk upload preview',
    description:
      'Returns the parsed CSV rows for a bulk upload that is awaiting user confirmation.',
  })
  async getPreview(
    @Param('bulkUploadId') bulkUploadId: string,
    @UserDecorator() user: ILoggedInUser,
  ): Promise<{
    records: any[];
    organizationId: number;
    totalCsvRows: number;
    skippedRows: number;
  }> {
    const { records, organizationId, totalCsvRows, skippedRows } =
      await this.bulkUploadService.getBulkUploadPreview(bulkUploadId);
    await this.bulkUploadService.canManageBulkUploadJobs({
      user,
      organizationId,
    });
    return { records, organizationId, totalCsvRows, skippedRows };
  }

  @Post('/:bulkUploadId/confirm')
  @UseGuards(
    AuthVerifiedGuard(['jwt', 'oauth2-client-password']),
    PermissionGuard,
  )
  @Permission('Write')
  @ACLModules('DEVICE_BULK_MANAGEMENT_CRUDL')
  @Roles(Role.Admin, Role.SiteOperator, Role.Registrant)
  @ApiOperation({
    summary: 'Confirm and import a staged bulk upload',
    description:
      'Triggers actual device creation for a bulk upload currently in PendingConfirmation status.',
  })
  async confirm(
    @Param('bulkUploadId') bulkUploadId: string,
    @UserDecorator() user: ILoggedInUser,
  ): Promise<{ successCount: number; failedCount: number }> {
    const { organizationId } =
      await this.bulkUploadService.getBulkUploadPreview(bulkUploadId);
    await this.bulkUploadService.canManageBulkUploadJobs({
      user,
      organizationId,
    });
    return this.bulkUploadService.confirmBulkUpload(bulkUploadId);
  }

  @Delete('/:bulkUploadId/discard')
  @UseGuards(
    AuthVerifiedGuard(['jwt', 'oauth2-client-password']),
    PermissionGuard,
  )
  @Permission('Delete')
  @ACLModules('DEVICE_BULK_MANAGEMENT_CRUDL')
  @Roles(Role.Admin, Role.SiteOperator, Role.Registrant)
  @ApiOperation({
    summary: 'Discard a staged bulk upload',
    description: 'Deletes the staged preview without inserting any devices.',
  })
  async discard(
    @Param('bulkUploadId') bulkUploadId: string,
    @UserDecorator() user: ILoggedInUser,
  ): Promise<{ success: boolean }> {
    const { organizationId } =
      await this.bulkUploadService.getBulkUploadPreview(bulkUploadId);
    await this.bulkUploadService.canManageBulkUploadJobs({
      user,
      organizationId,
    });
    await this.bulkUploadService.discardBulkUpload(bulkUploadId);
    return { success: true };
  }
}

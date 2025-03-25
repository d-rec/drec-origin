import {
  BadRequestException,
  Controller,
  DefaultValuePipe,
  Get,
  HttpStatus,
  Logger,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
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

@Controller('bulk-upload')
@ApiBearerAuth('access-token')
@ApiTags('Bulk Upload')
export class BulkUploadController {
  private readonly logger = new Logger(BulkUploadController.name);
  constructor(
    private readonly bulkUploadService: BulkUploadService,
    private readonly organizationService: OrganizationService,
    private readonly fileService: FileService,
  ) {}

  @Post()
  @UseGuards(AuthGuard())
  @Permission('Write')
  @ACLModules('READS_MANAGEMENT_CRUDL')
  @ACLModules('ORGANIZATION_MANAGEMENT_CRUDL')
  @ACLModules('DEVICE_BULK_MANAGEMENT_CRUDL')
  @Roles(Role.Admin, Role.DeviceOwner, Role.OrganizationAdmin, Role.ApiUser)
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
  ): Promise<BulkUploadEntity> {
    this.logger.verbose('Handling bulk upload');
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const organizationId = organizationIdParam || user.organizationId;

    const organization = await this.organizationService.findOne(organizationId);
    if (organization.organizationType != OrganizationType.Developer) {
      throw new UnauthorizedException(
        'Only Developer organizations can upload bulk files',
      );
    }

    await this.organizationService.checkIfCanManage({
      user,
      organizationId,
    });

    const [fileId] = await this.fileService.store(user, [file]);

    return await this.bulkUploadService.storeBulkUploadJob(
      fileId,
      user,
      organizationId,
      bulkUploadType,
    );
  }

  @Get()
  @UseGuards(AuthGuard(['jwt', 'oauth2-client-password']), PermissionGuard)
  @Permission('Read')
  @ACLModules('READS_MANAGEMENT_CRUDL')
  @ACLModules('DEVICE_BULK_MANAGEMENT_CRUDL')
  @Roles(Role.Admin, Role.DeviceOwner, Role.OrganizationAdmin, Role.ApiUser)
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

  @Get('/bulk-upload-log/:bulkUploadId')
  @UseGuards(AuthGuard(['jwt', 'oauth2-client-password']), PermissionGuard)
  @Permission('Read')
  @ACLModules('READS_MANAGEMENT_CRUDL')
  @ApiQuery({
    name: 'organizationId',
    type: Number,
    required: false,
    description: 'This query parameter is used for ApiUser',
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
}

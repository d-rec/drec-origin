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

@Controller('bulk-upload')
@ApiBearerAuth('access-token')
@ApiTags('bulk-upload')
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
  async upload(
    @UploadedFile() file: MeterReadFileDto,
    @UserDecorator() user: ILoggedInUser,
    @Query('organizationId') organizationId: number | null,
    @Query('bulkUploadType') bulkUploadType: BulkUploadType,
  ): Promise<BulkUploadEntity> {
    this.logger.verbose('Handling bulk upload');
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    const organization = await this.organizationService.findOne(organizationId);
    if (organization.organizationType != Role.Developer) {
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
  @ApiResponse({
    status: HttpStatus.OK,
    type: [BulkUploadEntity],
    description: 'Returns created jobs of an organization',
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
  @ApiResponse({
    status: HttpStatus.OK,
    type: GetBulkUploadDTO,
    description: 'Returns status of job id for bulk upload',
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

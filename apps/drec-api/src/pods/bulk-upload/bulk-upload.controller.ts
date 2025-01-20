import {
  BadRequestException,
  ConflictException,
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
import { Role } from '../../utils/enums';
import { ILoggedInUser } from '../../models';
import { GetBulkUploadDTO } from './dto/get-bulk-upload.dto';
import { OrganizationService } from '../organization/organization.service';
import { FileService } from '../file';
import { UserService } from '../user/user.service';
import { MeterReadFileDto } from '../reads/dto/meter-read-file.dto';
import { Permission } from '../permission/decorators/permission.decorator';
import { PermissionGuard } from '../../guards/PermissionGuard';
import { canManageOrganization } from '../../lib/organization';
import { UserDecorator } from '../user/decorators/user.decorator';

@Controller('bulk-upload')
@ApiBearerAuth('access-token')
@ApiTags('bulk-upload')
export class BulkUploadController {
  private readonly logger = new Logger(BulkUploadController.name);
  constructor(
    private readonly bulkUploadService: BulkUploadService,
    private readonly organizationService: OrganizationService,
    private readonly fileService: FileService,
    private readonly userService: UserService,
  ) {}
  @Post()
  @UseGuards(AuthGuard())
  @Permission('Write')
  @ACLModules('READS_MANAGEMENT_CRUDL')
  @ACLModules('ORGANIZATION_MANAGEMENT_CRUDL')
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
  async bulkUpload(
    @UploadedFile() file: MeterReadFileDto,
    @UserDecorator() user: ILoggedInUser,
    @Query('organizationId') organizationId: number | null,
    @Query('bulkUploadType') bulkUploadType: BulkUploadType,
  ): Promise<BulkUploadEntity> {
    this.logger.verbose('Handling meter read file upload');
    const organization = await this.organizationService.findOne(organizationId);
    if (organization.organizationType != 'Developer') {
      throw new UnauthorizedException(
        'Only Developer organizations can upload bulk files',
      );
    }
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
  @ApiQuery({
    name: 'orgId',
    type: Number,
    required: false,
    description: 'This query parameter is used for ApiUser',
  })
  @ApiQuery({ name: 'pageNumber', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [BulkUploadEntity],
    description: 'Returns created jobs of an organization',
  })
  public async getAllBulkUploadJobsForOrganization(
    @UserDecorator() user: ILoggedInUser,
    @Query('orgId', new DefaultValuePipe(null)) orgId: number | null,
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

    if (!user.organizationId) {
      this.logger.error(`User does not belong to any organization.`);
      throw new ConflictException({
        success: false,
        message: 'User does not belong to any organization.',
      });
    }

    if (orgId) {
      const organization = await this.organizationService.findOne(orgId);
      if (!organization) {
        throw new BadRequestException({
          success: false,
          message: `Organization with ID ${orgId} not found.`,
        });
      }

      const organizationAdmin = await this.userService.findByEmail(
        organization.orgEmail,
      );
      const canManage = canManageOrganization({
        user,
        organization,
        organizationAdmin,
      });

      if (!canManage) {
        this.logger.error(`Unauthorized access to organization.`);
        throw new UnauthorizedException({
          success: false,
          message: 'Unauthorized access to organization.',
        });
      }
    }

    return this.bulkUploadService.getBulkUploadJobsByRole(
      user,
      orgId,
      pageNumber,
      limit,
    );
  }

  @Get('/bulk-upload-log/:bulkUploadId')
  @UseGuards(AuthGuard(['jwt', 'oauth2-client-password']), PermissionGuard)
  @Permission('Read')
  @ACLModules('READS_MANAGEMENT_CRUDL')
  @ApiQuery({
    name: 'orgId',
    type: Number,
    required: false,
    description: 'This query parameter is used for ApiUser',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: GetBulkUploadDTO,
    description: 'Returns status of job id for bulk upload',
  })
  public async getBulkUploadLog(
    @Param('bulkUploadId') bulkUploadId: string,
    @UserDecorator() loggedInUser: ILoggedInUser,
    @Query('orgId', new DefaultValuePipe(null)) orgId: number | null,
  ): Promise<GetBulkUploadDTO | undefined> {
    this.logger.verbose(`With in getBulkUploadJobStatus`);

    const { role } = loggedInUser;

    if (orgId) {
      const organization = await this.organizationService.findOne(orgId);
      const organizationAdmin = await this.userService.findByEmail(
        organization.orgEmail,
      );

      if (
        !canManageOrganization({
          user: loggedInUser,
          organization,
          organizationAdmin,
        })
      ) {
        this.logger.error(`Unauthorized access to the organization.`);
        throw new UnauthorizedException({
          success: false,
          message: 'Unauthorized access to the organization',
        });
      }

      if (role === Role.Admin) {
        orgId = null;
      }
    } else if (role === Role.ApiUser) {
      this.logger.error(`Add the orgId at query param`);
      throw new BadRequestException({
        success: false,
        message: `Add the orgId at query param`,
      });
    }

    return await this.bulkUploadService.getBulkUploadFailedLog(bulkUploadId);
  }
}

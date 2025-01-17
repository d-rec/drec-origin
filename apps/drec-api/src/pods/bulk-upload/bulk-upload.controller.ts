import { UserDecorator } from '@energyweb/origin-backend-utils';
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
import { Permission } from '../permission/decorators/permission.decorator';
import { ACLModules } from '../access-control-layer-module-service/decorator/aclModule.decorator';
import { BulkUploadEntity, BulkUploadType } from './bulk-uploads.entity';
import { Role } from 'src/utils/enums';
import { ILoggedInUser } from 'src/models';
import { GetBulkUploadDTO } from './get-bulk-upload.dto';
import { PermissionGuard } from 'src/guards';
import { OrganizationService } from '../organization/organization.service';
import { FileService } from '../file';
import { UserService } from '../user/user.service';
import { MeterReadFileDto } from '../reads/dto/meter-read-file.dto';

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
  @Post('/:organizationId')
  @UseGuards(AuthGuard())
  @Permission('Read')
  @ACLModules('READS_MANAGEMENT_CRUDL')
  @ApiSecurity('bearer')
  @ApiConsumes('multipart/form-data')
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
    @Param('organizationId') organizationId: number | null,
    @Param('bulkUploadType') bulkUploadType: BulkUploadType,
  ): Promise<BulkUploadEntity> {
    this.logger.verbose('Handling meter read file upload');
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
  public async getAllCsvJobsBelongingToOrganization(
    @UserDecorator() user: ILoggedInUser,
    @UserDecorator() { organizationId }: ILoggedInUser,
    @Query('orgId', new DefaultValuePipe(null)) orgId: number | null,
    @Query('pageNumber', new DefaultValuePipe(1), ParseIntPipe)
    pageNumber: number,
    @Query('limit', new DefaultValuePipe(0), ParseIntPipe) limit: number,
  ): Promise<
    | {
        csvJobs: Array<BulkUploadEntity>;
        currentPage: number;
        totalPages: number;
        totalCount: number;
      }
    | any
  > {
    this.logger.verbose(`With in getAllCsvJobsBelongingToOrganization`);
    if (user.organizationId === null || user.organizationId === undefined) {
      this.logger.error(`User needs to have organization added`);
      throw new ConflictException({
        success: false,
        message: 'User needs to have organization added',
      });
    }

    if (orgId) {
      const organization = await this.organizationService.findOne(orgId);
      const orgUser = await this.userService.findByEmail(organization.orgEmail);

      if (user.role === Role.ApiUser) {
        if (organization.api_user_id != user.api_user_id) {
          this.logger.error(
            `The requested organization is belongs to other apiUser`,
          );
          throw new BadRequestException({
            success: false,
            message: 'The requested organization is belongs to other apiUser',
          });
        }

        if (orgUser.role != Role.OrganizationAdmin) {
          this.logger.error(`Unauthorized`);
          throw new UnauthorizedException({
            success: false,
            message: 'Unauthorized',
          });
        }
      } else {
        if (user.role != Role.Admin) {
          if (orgId != organizationId) {
            this.logger.error(
              `The orgId at query param is not same as user's organization`,
            );
            throw new BadRequestException({
              success: false,
              message: `The orgId at query param is not same as user's organization`,
            });
          }
        }
      }
    }

    if (user.role === 'Admin') {
      return this.bulkUploadService.getAllCSVJobsForAdmin(
        orgId,
        pageNumber,
        limit,
      );
    } else if (user.role === Role.ApiUser) {
      return this.bulkUploadService.getAllCSVJobsForApiUser(
        user.api_user_id,
        orgId,
        pageNumber,
        limit,
      );
    } else {
      return this.bulkUploadService.getAllBulkUploads(
        organizationId,
        pageNumber,
        limit,
      );
    }
  }

  @Get('/bulk-upload-status/:id')
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
  public async getBulkUploadJobStatus(
    @Param('id') bulkUploadId: string,
    @UserDecorator() { organizationId, role, api_user_id }: ILoggedInUser,
    @Query('orgId', new DefaultValuePipe(null)) orgId: number | null,
  ): Promise<GetBulkUploadDTO | undefined> {
    this.logger.verbose(`With in getBulkUploadJobStatus`);

    if (orgId) {
      const organization = await this.organizationService.findOne(orgId);
      const orgUser = await this.userService.findByEmail(organization.orgEmail);

      if (role === Role.ApiUser) {
        if (organization.api_user_id != api_user_id) {
          this.logger.error(
            `The requested organization is belongs to other apiUser`,
          );
          throw new BadRequestException({
            success: false,
            message: 'The requested organization is belongs to other apiUser',
          });
        }

        if (orgUser.role != Role.OrganizationAdmin) {
          this.logger.error(`Unauthorized`);
          throw new UnauthorizedException({
            success: false,
            message: 'Unauthorized',
          });
        }
      } else {
        if (orgId != organizationId && role != Role.Admin) {
          this.logger.error(
            `The organizationId in query params should be same as user's organizationId`,
          );
          throw new BadRequestException({
            success: false,
            message: `The organizationId in query params should be same as user's organizationId`,
          });
        } else if (role === Role.Admin) {
          orgId = null;
        }
      }
    } else {
      if (role === Role.ApiUser) {
        this.logger.error(`Add the orgId at query param`);
        throw new BadRequestException({
          success: false,
          message: `Add the orgId at query param`,
        });
      }
    }
    return await this.bulkUploadService.getBulkUploadFailedLog(bulkUploadId);
  }
}

import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  NotFoundException,
  Logger,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UnauthorizedException,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { DeviceReviewsService } from '../device-reviews/device-reviews.service';
import { Request } from 'express';

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
import { plainToClass } from 'class-transformer';

import { FindOneOptions } from 'typeorm';
import { AuthVerifiedGuard } from '../../guards';
import { PermissionGuard } from '../../guards/PermissionGuard';
import { RolesGuard } from '../../guards/RolesGuard';
import { ILoggedInUser } from '../../models';
import { countryCodesList } from '../../models/country-code';
import { Role } from '../../utils/enums';
import { ACLModules } from '../access-control-layer-module-service/decorator/aclModule.decorator';
import { DeviceGroup } from '../device-group/device-group.entity';
import { DeviceGroupService } from '../device-group/device-group.service';
import { OrganizationService } from '../organization/organization.service';
import { Permission } from '../permission/decorators/permission.decorator';
import { Roles } from '../user/decorators/roles.decorator';
import { UserDecorator } from '../user/decorators/user.decorator';
import { UserService } from '../user/user.service';
import { Device } from './device.entity';
import { DeviceService } from './device.service';
import {
  DeviceDTO,
  DeviceFiles,
  DeviceGroupByDTO,
  DeviceRegistrationBody,
  FilterDTO,
  GroupedDevicesDTO,
  NewDeviceDTO,
  UpdateDeviceDTO,
} from './dto';
import { CodeNameDTO } from './dto/code-name.dto';
import { BulkDeleteDevicesDTO } from './dto/bulk-delete.dto';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import { fileFilter } from '../../validations/file';
import { parseMetadata } from '../../lib/helpers/parseMetadata';
import {
  DocumentType,
  DocumentTargetType,
} from '../document-uploads/entities/documents.entity';
import { DocumentUploadsService } from '../document-uploads/document-uploads.service';
import { validateOrReject } from 'class-validator';
import { ReadsService } from '../reads/reads.service';
import { UploadLogService } from '../upload-log/upload-log.service';
import { UploadActionType } from '../upload-log/upload-log.entity';
import { ESignatureService } from '../e-signature/e-signature.service';
import { assertUserCanAccessGroup } from '../../utils/group-access';

/**
 * It is Controller of device with the endpoints of device operations.
 */
@ApiTags('Device')
@ApiBearerAuth('access-token')
@ApiSecurity('drec')
@Controller('/device')
export class DeviceController {
  private readonly logger = new Logger(DeviceController.name);

  constructor(
    private readonly deviceGroupService: DeviceGroupService,
    private readonly deviceService: DeviceService,
    private readonly organizationService: OrganizationService,
    private readonly userService: UserService,
    private readonly readsService: ReadsService,
    private readonly documentUploadsService: DocumentUploadsService,
    private readonly uploadLogService: UploadLogService,
    private readonly eSignatureService: ESignatureService,
    @Inject(forwardRef(() => DeviceReviewsService))
    private readonly deviceReviewsService: DeviceReviewsService,
  ) {}

  /**
   * It is GET api to list all devices with paginatiion and fiteration by organization and filterationDTO
   */
  @Get()
  @UseGuards(AuthVerifiedGuard('jwt'), RolesGuard, PermissionGuard)
  @Roles(Role.Admin, Role.Registrant)
  @Permission('Read')
  @ACLModules('DEVICE_MANAGEMENT_CRUDL')
  @ApiQuery({ name: 'pagenumber', type: Number, required: false })
  @ApiQuery({ name: 'OrganizationId', type: Number, required: false })
  @ApiOperation({
    summary: 'Retrieve all devices',
    description:
      'Fetch a paginated list of all devices, with optional filtering by organization ID.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved the list of devices.',
    type: [DeviceDTO],
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description:
      'Forbidden. The user does not have permission to view the list of devices.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description:
      'Unauthorized. User is not authorized to access the device list.',
  })
  async getAll(
    @Query(ValidationPipe) filterDTO: FilterDTO,
    @Query('pagenumber') pageNumber: number | null,
    @Query('OrganizationId') OrgId: number | null,
  ): Promise<{ devices: Device[]; currentPage; totalPages; totalCount }> {
    this.logger.verbose(`With in getAll`);
    return this.deviceService.find(filterDTO, pageNumber, OrgId);
  }

  /**
   * It is GET api to list all devices for reservation
   * @return {Array<DeviceDTO>} return array of devices for reservation
   */
  @Get('/ungrouped/buyerreservation')
  @UseGuards(
    AuthVerifiedGuard(['jwt', 'oauth2-client-password']),
    PermissionGuard,
    RolesGuard,
  )
  @Permission('Read')
  @ACLModules('DEVICE_MANAGEMENT_CRUDL')
  @Roles(Role.Registrant)
  @ApiOperation({
    summary: 'Retrieve ungrouped devices for buyer reservation',
    description: 'Fetch all devices available for reservation by buyers.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved devices for reservation',
    type: [DeviceDTO],
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access to the resource is forbidden',
  })
  async getAllDeviceForBuyer(
    @Query(ValidationPipe) filterDTO: FilterDTO,
    @Query('pagenumber') pageNumber: number | null,
    @UserDecorator() { organizationId, api_user_id, role }: ILoggedInUser,
  ): Promise<DeviceDTO[]> {
    this.logger.verbose(`With in getAllDeviceForBuyer`);
    if (!filterDTO.organizationId) {
      filterDTO.organizationId = organizationId;
    }
    const organization = await this.organizationService.findOne(
      filterDTO.organizationId,
    );
    if (role === Role.Registrant) {
      if (organization.api_user_id != api_user_id) {
        this.logger.error(
          `The requested organization is belongs to other registrant`,
        );
        throw new UnauthorizedException({
          success: false,
          message: `The requested organization is belongs to other registrant`,
        });
      }
    }
    return this.deviceService.findDeviceForBuyer(
      filterDTO,
      pageNumber,
      api_user_id,
    );
  }

  /**
   * It is GET api to list all ungrouped devices with filteration
   * @return {GroupedDevicesDTO} returns ungrouped devices
   */
  @Get('/ungrouped')
  @UseGuards(AuthVerifiedGuard('jwt'), RolesGuard, PermissionGuard)
  @Roles(Role.Registrant)
  @Permission('Read')
  @ACLModules('DEVICE_MANAGEMENT_CRUDL')
  @ApiOperation({
    summary: 'Retrieve all ungrouped devices',
    description:
      'Fetch a list of all ungrouped devices with optional filtering.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved the list of ungrouped devices.',
    type: [GroupedDevicesDTO],
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have permission to view ungrouped devices.',
  })
  async getAllUngrouped(
    @UserDecorator() { organizationId }: ILoggedInUser,
    @Query(ValidationPipe) orderFilterDTO: DeviceGroupByDTO,
    @Query(ValidationPipe) filterDTO?: FilterDTO,
    @Query('pagenumber') pageNumber?: number | null,
    @Query('orgId') orgId?: number,
  ): Promise<{
    totalPages: number;
    currentPage: number;
    groups: GroupedDevicesDTO[];
  }> {
    this.logger.verbose(`With in getAllUngrouped`);
    if (orgId) {
      organizationId = orgId;
    }
    return this.deviceService.findUngrouped(
      organizationId,
      orderFilterDTO,
      filterDTO,
      pageNumber,
    );
  }

  /**
   * It is GET to list all device code types in dropdown
   * @returns {Array<CodeNameDTO>}
   */
  @Get('/device-type')
  @ApiOperation({
    summary: 'Retrieve all device types',
    description: 'Fetch a list of all available device types.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved the list of device types.',
    type: [CodeNameDTO],
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have permission to view device types.',
  })
  getDeviceTypes(): CodeNameDTO[] {
    this.logger.verbose(`With in getDeviceTypes`);
    const deviceTypes = this.deviceService.getDeviceTypes();
    return deviceTypes.map((deviceType) =>
      plainToClass(CodeNameDTO, deviceType),
    );
  }

  /**
   * It is GET api to list all fuel types in dropdown
   * @returns {Array<CodeNameDTO>}
   */
  @Get('/fuel-type')
  @ApiOperation({
    summary: 'Retrieve all fuel types',
    description: 'Fetch a list of all available fuel types.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved the list of fuel types.',
    type: [CodeNameDTO],
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have permission to view fuel types.',
  })
  getFuelTypes(): CodeNameDTO[] {
    this.logger.verbose(`With in getFuelTypes`);
    const fuelTypes = this.deviceService.getFuelTypes();
    return fuelTypes.map((fuelType) => plainToClass(CodeNameDTO, fuelType));
  }

  /**
   * It is GET api to list all my devices with filteration and pagination
   * @returns {Array<DeviceDTO>}
   */
  @Get('/my')
  @UseGuards(
    AuthVerifiedGuard(['jwt', 'oauth2-client-password']),
    PermissionGuard,
  )
  @Permission('Read')
  @ACLModules('DEVICE_MANAGEMENT_CRUDL')
  @ApiQuery({ name: 'pagenumber', type: Number, required: false })
  @ApiOperation({
    summary: 'Retrieve my devices',
    description: 'Fetch a paginated list of devices owned by the user.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Successfully retrieved the list of devices owned by the user.',
    type: [DeviceDTO],
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have permission to view their devices.',
  })
  async getMyDevices(
    @Query(ValidationPipe) filterDTO: FilterDTO,
    @UserDecorator() { organizationId, api_user_id, role }: ILoggedInUser,
    @Query('pagenumber') pageNumber: number | null,
  ): Promise<any> {
    this.logger.verbose(`With in getMyDevices`);
    if (filterDTO.country) {
      filterDTO.country = filterDTO.country.toUpperCase();

      if (
        filterDTO.country &&
        typeof filterDTO.country === 'string' &&
        filterDTO.country.length === 3
      ) {
        if (
          countryCodesList.find(
            (ele) => ele.countryCode === filterDTO.country,
          ) === undefined
        ) {
          this.logger.error(
            `Invalid countryCode, some of the valid country codes are "GBR" - "United Kingdom of Great Britain and Northern Ireland",  "CAN" - "Canada"  "IND" - "India", "DEU"-  "Germany"`,
          );
          throw new ConflictException({
            success: false,
            message:
              ' Invalid countryCode, some of the valid country codes are "GBR" - "United Kingdom of Great Britain and Northern Ireland",  "CAN" - "Canada"  "IND" - "India", "DEU"-  "Germany"',
          });
        }
      } else {
        this.logger.error(
          `Invalid countryCode, some of the valid country codes are "GBR" - "United Kingdom of Great Britain and Northern Ireland",  "CAN" - "Canada"  "IND" - "India", "DEU"-  "Germany"`,
        );
        throw new ConflictException({
          success: false,
          message:
            ' Invalid countryCode, some of the valid country codes are "GBR" - "United Kingdom of Great Britain and Northern Ireland",  "CAN" - "Canada"  "IND" - "India", "DEU"-  "Germany"',
        });
      }
    }
    if (filterDTO.organizationId) {
      if (role === Role.Registrant) {
        const organization = await this.organizationService.findOne(
          filterDTO.organizationId,
        );
        const orgUser = await this.userService.findByEmail(
          organization.orgEmail,
        );
        if (organization.api_user_id != api_user_id) {
          this.logger.error(
            `The organization Id in param is belongs to other registrant`,
          );
          throw new UnauthorizedException({
            success: false,
            message:
              'The organization Id in param is belongs to other registrant',
          });
        } else {
          if (orgUser.role != Role.Registrant) {
            this.logger.error(`Unauthorized`);
            throw new UnauthorizedException({
              success: false,
              message: 'Unauthorized',
            });
          }
        }
      } else {
        if (filterDTO.organizationId != organizationId) {
          this.logger.error(
            `The organization Id in param should be same as user's organization`,
          );
          throw new UnauthorizedException({
            success: false,
            message: `The organization Id in param should be same as user's organization`,
          });
        }
      }

      organizationId = filterDTO.organizationId;
    }

    this.logger.log('In devices before calling service');
    return await this.deviceService.getOrganizationDevices(
      organizationId,
      api_user_id,
      role,
      filterDTO,
      pageNumber,
    );
  }

  @Get('/check-name')
  @UseGuards(AuthVerifiedGuard('jwt'))
  @ApiQuery({ name: 'name', type: String, required: true })
  @ApiOperation({ summary: 'Check if a site name already exists' })
  @ApiResponse({ status: HttpStatus.OK, description: '{ exists: boolean }' })
  async checkSiteName(
    @Query('name') name: string,
  ): Promise<{ exists: boolean }> {
    const exists = await this.deviceService.checkSiteNameExists(name);
    return { exists };
  }

  /**
   * It is GET api to fetch an device by the deviceId in param
   * @param id is deviceId in type number
   * @returns {DeviceDTO | null} DeviceDTO for success response and null when there is no device found by the id
   */
  @Get('/:id')
  @UseGuards(
    AuthVerifiedGuard(['jwt', 'oauth2-client-password']),
    PermissionGuard,
  )
  @Permission('Read')
  @ACLModules('DEVICE_MANAGEMENT_CRUDL')
  @ApiQuery({ name: 'apiUserId', type: String, required: false })
  @ApiQuery({ name: 'organizationId', type: Number, required: false })
  @ApiOperation({
    summary: 'Fetch device by ID',
    description: 'Retrieve a device using its ID.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved the device details.',
    type: DeviceDTO,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The specified device does not exist.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have permission to view devices.',
  })
  async get(
    @Param('id') id: number,
    @Query('apiUserId') api_user_id: string | null,
    @Query('organizationId') organizationId: number | null,
  ): Promise<any> {
    this.logger.verbose(`With in get`);
    let deviceData: Device;
    if (api_user_id && organizationId) {
      deviceData = await this.deviceService.findOne(id, {
        api_user_id: api_user_id,
        organizationId: organizationId,
      } as FindOneOptions<Device>);
    } else {
      deviceData = await this.deviceService.findOne(id);
    }

    // Look up review status from submissions table
    let reviewStatus: string | null = null;
    if (deviceData?.siteName) {
      const rows: any[] = await this.deviceService.getConnection().query(
        `SELECT s.status FROM submissions s
         WHERE regexp_replace(s.project_subfolder,
           '-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
           '', 'i')
         = regexp_replace(lower($1), '[^a-z0-9]+', '-', 'g')
         LIMIT 1`,
        [deviceData.siteName],
      );
      reviewStatus = rows[0]?.status ?? null;
    }

    // OC#42 — surface the most recent e-signature log entry as flat fields
    // so the reviewer's device-info-window can render "Signed {date} by {email}"
    // without a second network round-trip.
    let eSignatureSignedAt: Date | null = null;
    let eSignatureSignerEmail: string | null = null;
    if (deviceData?.id) {
      const sigs = await this.eSignatureService.findByDevice(deviceData.id);
      if (sigs.length > 0) {
        eSignatureSignedAt = sigs[0].signedAt;
        eSignatureSignerEmail = sigs[0].userEmail;
      }
    }

    return {
      ...deviceData,
      reviewStatus,
      eSignatureSignedAt,
      eSignatureSignerEmail,
    };
  }

  /**
   * It is GET api to fetch an device by externalId in param
   * @param id  is externalId in device
   * @param param1
   * @returns {DeviceDTO | null} DeviceDTO for success response and null when there is no device found by the id
   */
  @Get('externalId/:id')
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Read')
  @ACLModules('DEVICE_MANAGEMENT_CRUDL')
  @ApiOperation({
    summary: 'Fetch device by external ID',
    description: 'Retrieve a device using its external identifier.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved the device details.',
    type: DeviceDTO,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The specified device does not exist.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have permission to view this device.',
  })
  async getBySerialNumber(
    @Param('id') serialNumber: string,
    @UserDecorator() loginUser: ILoggedInUser,
  ): Promise<DeviceDTO | null> {
    this.logger.verbose(`With in getBySerialNumber`);
    let deviceData: Device;

    if (loginUser.role === Role.Registrant || loginUser.role === Role.Admin) {
      // Registrant/Admin lookups stay scoped by api_user_id (their own devices),
      // not by org. externalId → api_user_id-scoped serialNumber.
      if (loginUser.role === Role.Admin) {
        loginUser.api_user_id = null;
      }
      deviceData = await this.deviceService.findByExternalId(serialNumber);
      if (!deviceData) {
        deviceData = await this.deviceService.findBySerialNumberAndRegistrant(
          serialNumber,
          loginUser.api_user_id,
        );
      }
    } else {
      // External API surface — externalId → siteName (if unique-in-org) → serialNumber (deprecated)
      deviceData = await this.deviceService.resolveDeviceKey(
        serialNumber,
        loginUser.organizationId,
      );
    }
    if (!deviceData) return null;
    delete deviceData['operatorExternalId'];
    return deviceData;
  }

  @Get('/:id/documents')
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Read')
  @ACLModules('DEVICE_MANAGEMENT_CRUDL')
  @ApiOperation({ summary: 'Get documents for a device' })
  public async getDocuments(
    @Param('id') id: string,
  ): Promise<
    {
      type: string;
      url: string;
      id: number;
      label: string | null;
      originalFilename: string | null;
      createdAt: Date;
      extractions: Record<string, any>;
    }[]
  > {
    return this.documentUploadsService.findByTarget(
      parseInt(id, 10),
      DocumentTargetType.DEVICE,
    );
  }

  @Delete('/:id/documents/:docId')
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Write')
  @ACLModules('DEVICE_MANAGEMENT_CRUDL')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a single document from a device' })
  public async deleteDocument(
    @Param('id') id: string,
    @Param('docId', ParseIntPipe) docId: number,
  ): Promise<void> {
    await this.documentUploadsService.deleteById(docId, parseInt(id, 10));
  }

  /**
   * Upload one document to a device immediately, without going through the
   * full update flow. Used for instant uploads (camera screenshot, on-the-fly
   * doc-replacement) so the user doesn't have to remember to press Save.
   * Multi-file slots append; single-file slots replace.
   */
  @Post('/:id/documents/:type')
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Write')
  @ACLModules('DEVICE_MANAGEMENT_CRUDL')
  @UseInterceptors(FileInterceptor('file', { fileFilter }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a single document to a device' })
  public async uploadSingleDocument(
    @Param('id', ParseIntPipe) id: number,
    @Param('type') type: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ id: number; url: string; type: string; createdAt: Date }> {
    if (!file) {
      throw new BadRequestException('file is required');
    }
    const docType = type as DocumentType;
    if (!Object.values(DocumentType).includes(docType)) {
      throw new BadRequestException(`unknown document type: ${type}`);
    }

    await this.deviceService.assertDocumentsEditable(id);

    const device = await this.deviceService.findOne(id);
    if (!device) {
      throw new NotFoundException(`device ${id} not found`);
    }
    const slug = (device.siteName || 'project')
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .toLowerCase();
    const subfolder = `${slug}-${id}`;

    const multiFileTypes = new Set<string>([
      DocumentType.PROJECT_PHOTOS,
      DocumentType.METERING_EVIDENCE,
      DocumentType.OTHER_DOCUMENTS,
    ]);
    if (!multiFileTypes.has(docType)) {
      await this.documentUploadsService.deleteByType(
        id,
        DocumentTargetType.DEVICE,
        docType,
      );
    }

    const saved = await this.documentUploadsService.upload(
      id,
      DocumentTargetType.DEVICE,
      docType,
      file,
      subfolder,
    );
    return {
      id: saved.id,
      url: saved.url,
      type: saved.type,
      createdAt: saved.createdAt,
    };
  }

  /**
   * It is POST api to create an device
   * @param param0 It is organizationId from user at request
   * @param deviceToRegister It is body payload to create device
   * @returns {DeviceDTO}
   */
  @Post()
  @UseGuards(
    AuthVerifiedGuard(['jwt', 'oauth2-client-password']),
    RolesGuard,
    PermissionGuard,
  )
  @Roles(Role.Registrant)
  @Permission('Write')
  @ACLModules('DEVICE_MANAGEMENT_CRUDL')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: DocumentType.FORM_SF_02, maxCount: 10 },
        { name: DocumentType.SF_02C, maxCount: 10 },
        { name: DocumentType.PROOF_OF_OWNERSHIP, maxCount: 10 },
        { name: DocumentType.METERING_EVIDENCE, maxCount: 10 },
        { name: DocumentType.SINGLE_LINE_DIAGRAM, maxCount: 10 },
        { name: DocumentType.PROJECT_PHOTOS, maxCount: 10 },
        { name: DocumentType.COD_PROOF, maxCount: 10 },
        { name: DocumentType.OTHER_DOCUMENTS, maxCount: 20 },
      ],
      {
        fileFilter: fileFilter,
      },
    ),
  )
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    description: 'Device registration with optional documents',
    schema: {
      type: 'object',
      properties: {
        [DocumentType.FORM_SF_02]: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
        [DocumentType.SF_02C]: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
        [DocumentType.PROOF_OF_OWNERSHIP]: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
        [DocumentType.METERING_EVIDENCE]: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
        [DocumentType.SINGLE_LINE_DIAGRAM]: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
        [DocumentType.PROJECT_PHOTOS]: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
        [DocumentType.COD_PROOF]: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
        [DocumentType.OTHER_DOCUMENTS]: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
        deviceToRegister: {
          $ref: '#/components/schemas/NewDeviceDTO',
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Create a new device',
    description: 'Register a new device in the system.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Successfully created the device.',
    type: NewDeviceDTO,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have permission to create devices.',
  })
  public async create(
    @UserDecorator() user: ILoggedInUser,
    @Body() body: DeviceRegistrationBody,
    @UploadedFiles()
    files: DeviceFiles | undefined,
    @Req() req: Request,
  ): Promise<DeviceDTO> {
    this.logger.verbose(`With in create`);
    let { organizationId, role, api_user_id } = user;
    // Dual-path: multipart sends device data in `deviceToRegister` field;
    // plain JSON sends it directly as the body.
    const deviceToRegister = (
      body.deviceToRegister != null
        ? parseMetadata(
            body.deviceToRegister as unknown as Record<string, unknown>,
          )
        : (body as unknown as NewDeviceDTO)
    ) as NewDeviceDTO;
    if (!deviceToRegister)
      throw new BadRequestException('Invalid device data format');
    const deviceDtoInstance = plainToClass(NewDeviceDTO, deviceToRegister);
    try {
      await validateOrReject(deviceDtoInstance);
    } catch (errors) {
      throw new BadRequestException(
        errors
          .map((error) =>
            error.constraints
              ? Object.values(error.constraints).join(', ')
              : '',
          )
          .filter(Boolean)
          .join(', '),
      );
    }
    if (role === Role.Admin || role === Role.Registrant) {
      if (deviceToRegister.organizationId) {
        this.logger.debug('Line No: 314');
        organizationId = deviceToRegister.organizationId;
      } else {
        this.logger.error(
          `Organization id is required, please add the organization`,
        );
        throw new ConflictException({
          success: false,
          message: `Organization id is required, please add the organization`,
        });
      }
    } else {
      const organization = await this.organizationService.findOne(
        deviceToRegister.organizationId,
      );
      api_user_id = organization.api_user_id;
    }
    const result = await this.deviceService.register(
      organizationId,
      deviceToRegister,
      files || null,
      api_user_id,
      role,
    );
    if (files) {
      for (const [field, fileList] of Object.entries(files)) {
        for (const file of fileList as Express.Multer.File[]) {
          this.uploadLogService.logFileUpload({
            deviceId: result.id,
            userId: user.id,
            userEmail: user.email,
            organizationId,
            actionType: UploadActionType.DocumentUpload,
            fileName: file.originalname,
            fileBuffer: file.buffer,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            metadata: { documentType: field },
          });
        }
      }
    }

    // Log e-signature: the caller consented to the I-REC Code when submitting
    const rawEsig = (body as any).eSignature;
    const esigMeta =
      typeof rawEsig === 'string' ? JSON.parse(rawEsig) : rawEsig;
    this.eSignatureService
      .log({
        userId: user.id,
        userEmail: user.email,
        organizationId,
        action: 'device_registration_consent',
        consentText:
          'I agree to be subject to the I-REC Code and warrant that the information contained in this application is truthful and exhaustive.',
        consentVersion: '1.0',
        payloadToHash: JSON.stringify(deviceToRegister),
        deviceId: result.id,
        deviceExternalId: result.externalId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        browserFingerprint: esigMeta?.browserFingerprint,
        screenResolution: esigMeta?.screenResolution,
        timezone: esigMeta?.timezone,
        language: esigMeta?.language,
        metadata: esigMeta?.metadata,
        signedAt: esigMeta?.signedAt ? new Date(esigMeta.signedAt) : new Date(),
      })
      .catch((err) =>
        this.logger.error(`Failed to log e-signature: ${err.message}`),
      );

    return result;
  }

  /**
   * PATCH api to update a device by site name
   */
  @Patch('/by-site/:siteName')
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Update')
  @ACLModules('DEVICE_MANAGEMENT_CRUDL')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: DocumentType.FORM_SF_02, maxCount: 10 },
        { name: DocumentType.SF_02C, maxCount: 10 },
        { name: DocumentType.PROOF_OF_OWNERSHIP, maxCount: 10 },
        { name: DocumentType.METERING_EVIDENCE, maxCount: 10 },
        { name: DocumentType.SINGLE_LINE_DIAGRAM, maxCount: 10 },
        { name: DocumentType.PROJECT_PHOTOS, maxCount: 10 },
        { name: DocumentType.COD_PROOF, maxCount: 10 },
        { name: DocumentType.OTHER_DOCUMENTS, maxCount: 20 },
      ],
      {
        fileFilter: fileFilter,
      },
    ),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Update device by site name',
    description:
      'Update the details of an existing device using its site name.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully updated the device details.',
    type: UpdateDeviceDTO,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The specified device does not exist.',
  })
  public async updateBySiteName(
    @UserDecorator() user: ILoggedInUser,
    @Param('siteName') siteName: string,
    @Body() body: any,
    @UploadedFiles() files: DeviceFiles,
    @Req() req: Request,
  ): Promise<DeviceDTO> {
    this.logger.verbose(`With in updateBySiteName`);
    const deviceToUpdate = (
      body.deviceToUpdate != null
        ? parseMetadata(
            body.deviceToUpdate as unknown as Record<string, unknown>,
          )
        : body
    ) as UpdateDeviceDTO;
    if (!deviceToUpdate)
      throw new BadRequestException('Invalid device data format');
    const deviceDtoInstance = plainToClass(UpdateDeviceDTO, deviceToUpdate);
    try {
      await validateOrReject(deviceDtoInstance, {
        skipMissingProperties: true,
      });
    } catch (errors) {
      throw new BadRequestException(
        errors
          .map((error) =>
            error.constraints
              ? Object.values(error.constraints).join(', ')
              : '',
          )
          .filter(Boolean)
          .join(', '),
      );
    }

    if (deviceToUpdate.organizationId != null) {
      await this.organizationService.checkIfCanManage({
        user,
        organizationId: deviceToUpdate.organizationId,
      });
      user.organizationId = deviceToUpdate.organizationId;
    }

    const result = await this.deviceService.update(
      user.organizationId,
      user.role,
      siteName,
      deviceToUpdate,
      'siteName',
    );

    if (files) {
      const existingDevice = await this.deviceService.findBySiteName(
        result.siteName || siteName,
        user.organizationId,
      );

      if (existingDevice) {
        await this.deviceService.assertDocumentsEditable(existingDevice.id);

        const documentTypes = {
          [DocumentType.FORM_SF_02]: DocumentType.FORM_SF_02,
          [DocumentType.SF_02C]: DocumentType.SF_02C,
          [DocumentType.PROOF_OF_OWNERSHIP]:
            DocumentType.PROOF_OF_OWNERSHIP,
          [DocumentType.METERING_EVIDENCE]: DocumentType.METERING_EVIDENCE,
          [DocumentType.SINGLE_LINE_DIAGRAM]: DocumentType.SINGLE_LINE_DIAGRAM,
          [DocumentType.PROJECT_PHOTOS]: DocumentType.PROJECT_PHOTOS,
          [DocumentType.COD_PROOF]: DocumentType.COD_PROOF,
          [DocumentType.OTHER_DOCUMENTS]: DocumentType.OTHER_DOCUMENTS,
        };

        const siteSlug = (existingDevice.siteName || 'project')
          .replace(/[^a-zA-Z0-9-_]/g, '-')
          .toLowerCase();
        const projectSubfolder = `${siteSlug}-${existingDevice.id}`;

        for (const [field, documentType] of Object.entries(documentTypes)) {
          if (files[field] && Array.isArray(files[field])) {
            await this.documentUploadsService.deleteByType(
              existingDevice.id,
              DocumentTargetType.DEVICE,
              documentType as DocumentType,
            );
            for (const file of files[field]) {
              try {
                await this.documentUploadsService.upload(
                  existingDevice.id,
                  DocumentTargetType.DEVICE,
                  documentType as DocumentType,
                  file,
                  projectSubfolder,
                );
                this.uploadLogService.logFileUpload({
                  userId: user.id,
                  userEmail: user.email,
                  organizationId: user.organizationId,
                  actionType: UploadActionType.DocumentUpload,
                  fileName: file.originalname,
                  fileBuffer: file.buffer,
                  ipAddress: req.ip,
                  userAgent: req.headers['user-agent'],
                  metadata: { documentType: field },
                });
              } catch (error) {
                const msg =
                  error?.message ??
                  (typeof error === 'string' ? error : String(error));
                this.logger.error(
                  `Failed to upload ${field}: ${msg}`,
                  error?.stack,
                );
                throw new BadRequestException(
                  `Failed to upload ${field}: ${msg || 'Invalid file format or size'}`,
                );
              }
            }
          }
        }
      }
    }

    // Auto-regen the canonical SF-02 if device data changed and the
    // existing SF-02 is auto-generated. Silent no-op otherwise.
    const updatedBySite = await this.deviceService.findBySiteName(
      result.siteName || siteName,
      user.organizationId,
    );
    if (updatedBySite?.id) {
      await this.deviceReviewsService.maybeRegenerateAutoSf02(updatedBySite.id);
    }

    return result;
  }

  /**
   * It is PATCH api to update an device by externalId
   * @param user is loggedin user from user at request
   * @param externalId is unique external id in device entity
   * @param deviceToUpdate is body payload to update an device
   * @returns {DeviceDTO}
   */
  @Patch('/:externalId')
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Update')
  @ACLModules('DEVICE_MANAGEMENT_CRUDL')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: DocumentType.FORM_SF_02, maxCount: 10 },
        { name: DocumentType.SF_02C, maxCount: 10 },
        { name: DocumentType.PROOF_OF_OWNERSHIP, maxCount: 10 },
        { name: DocumentType.METERING_EVIDENCE, maxCount: 10 },
        { name: DocumentType.SINGLE_LINE_DIAGRAM, maxCount: 10 },
        { name: DocumentType.PROJECT_PHOTOS, maxCount: 10 },
        { name: DocumentType.COD_PROOF, maxCount: 10 },
        { name: DocumentType.OTHER_DOCUMENTS, maxCount: 20 },
      ],
      {
        fileFilter: fileFilter,
      },
    ),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Update device by external ID',
    description:
      'Update the details of an existing device using its external identifier.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully updated the device details.',
    type: UpdateDeviceDTO,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The specified device does not exist.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have permission to update this device.',
  })
  public async update(
    @UserDecorator() user: ILoggedInUser,
    @Param('externalId') serialNumber: string,
    @Query('serialNumberChanged') serialNumberChanged: string,
    @Body() body: any,
    @UploadedFiles() files: DeviceFiles,
    @Req() req: Request,
  ): Promise<DeviceDTO> {
    this.logger.verbose(`With in update`);
    // When sent as multipart/form-data (files attached), body.deviceToUpdate is a JSON string.
    // When sent as application/json (no files), body IS the device data directly.
    const deviceToUpdate = (
      body.deviceToUpdate != null
        ? parseMetadata(
            body.deviceToUpdate as unknown as Record<string, unknown>,
          )
        : body
    ) as UpdateDeviceDTO;
    if (!deviceToUpdate)
      throw new BadRequestException('Invalid device data format');
    const deviceDtoInstance = plainToClass(UpdateDeviceDTO, deviceToUpdate);
    try {
      await validateOrReject(deviceDtoInstance, {
        skipMissingProperties: true,
      });
    } catch (errors) {
      throw new BadRequestException(
        errors
          .map((error) =>
            error.constraints
              ? Object.values(error.constraints).join(', ')
              : '',
          )
          .filter(Boolean)
          .join(', '),
      );
    }

    if (deviceToUpdate.organizationId != null) {
      await this.organizationService.checkIfCanManage({
        user,
        organizationId: deviceToUpdate.organizationId,
      });
      user.organizationId = deviceToUpdate.organizationId;
    }
    const isSerialNumberChanged = serialNumberChanged === 'true';
    if (isSerialNumberChanged) {
      if (deviceToUpdate.serialNumber) {
        const checkSerialNumber = await this.deviceService.findBySerialNumber(
          deviceToUpdate.serialNumber,
          user.organizationId,
        );
        if (checkSerialNumber) {
          this.logger.log('Line No: 236');
          throw new ConflictException({
            success: false,
            message: `SerialNumber already exist in this organization, can't update with same serialNumber ${deviceToUpdate.serialNumber}`,
          });
        }
      }
    }

    if (deviceToUpdate.commissioningDate) {
      // externalId → siteName (if uniquely scoped to org) → serialNumber (deprecated)
      const checkDevice = await this.deviceService.resolveDeviceKey(
        serialNumber,
        user.organizationId,
      );
      if (checkDevice) {
        const noOfHistRead: number =
          await this.deviceService.getNumberOfHistoryReads(
            checkDevice.serialNumber,
          );
        const noOfOnGoingRead: number =
          await this.readsService.countOngoingReadsSinceDeviceOnboardingDate(
            checkDevice.serialNumber,
            checkDevice.createdAt,
          );

        if (
          deviceToUpdate.commissioningDate != checkDevice.commissioningDate
        ) {
          if (noOfHistRead > 0 || noOfOnGoingRead > 0) {
            this.logger.error(
              `Commissioning date cannot be changed due to existing meter reads available for ${checkDevice.serialNumber}`,
            );
            throw new ConflictException({
              success: false,
              message: ` Commissioning date cannot be changed due to existing meter reads available for ${checkDevice.serialNumber}`,
            });
          }
        }
      }
    }

    // externalId → siteName (if uniquely scoped to org) → serialNumber (deprecated)
    const deviceForUpdate = await this.deviceService.resolveDeviceKey(
      serialNumber,
      user.organizationId,
    );
    if (!deviceForUpdate) {
      throw new NotFoundException(`No device found with identifier "${serialNumber}"`);
    }

    // Pass the resolved externalId so update()'s inner lookup hits on the first try.
    const result = await this.deviceService.update(
      user.organizationId,
      user.role,
      deviceForUpdate.externalId,
      deviceToUpdate,
    );

    if (files) {
      // externalId → siteName (if uniquely scoped to org) → serialNumber (deprecated)
      const existingDevice = await this.deviceService.resolveDeviceKey(
        result.externalId || serialNumber,
        user.organizationId,
      );

      if (existingDevice) {
        // §3.3.3: block document changes after review approval
        await this.deviceService.assertDocumentsEditable(existingDevice.id);

        const documentTypes = {
          [DocumentType.FORM_SF_02]: DocumentType.FORM_SF_02,
          [DocumentType.SF_02C]: DocumentType.SF_02C,
          [DocumentType.PROOF_OF_OWNERSHIP]:
            DocumentType.PROOF_OF_OWNERSHIP,
          [DocumentType.METERING_EVIDENCE]: DocumentType.METERING_EVIDENCE,
          [DocumentType.SINGLE_LINE_DIAGRAM]: DocumentType.SINGLE_LINE_DIAGRAM,
          [DocumentType.PROJECT_PHOTOS]: DocumentType.PROJECT_PHOTOS,
          [DocumentType.COD_PROOF]: DocumentType.COD_PROOF,
          [DocumentType.OTHER_DOCUMENTS]: DocumentType.OTHER_DOCUMENTS,
        };

        const siteName = (existingDevice.siteName || 'project')
          .replace(/[^a-zA-Z0-9-_]/g, '-')
          .toLowerCase();
        const projectSubfolder = `${siteName}-${existingDevice.id}`;

        // Multi-file slots: new uploads append to the existing set instead of
        // replacing it. Single-file slots (SF-02, SLD, COD proof, etc.) still
        // replace, because the registrant can only have one of each.
        const multiFileTypes = new Set<string>([
          DocumentType.PROJECT_PHOTOS,
          DocumentType.METERING_EVIDENCE,
          DocumentType.OTHER_DOCUMENTS,
        ]);
        for (const [field, documentType] of Object.entries(documentTypes)) {
          if (files[field] && Array.isArray(files[field])) {
            if (!multiFileTypes.has(documentType)) {
              // Remove old documents of this type before uploading replacements
              await this.documentUploadsService.deleteByType(
                existingDevice.id,
                DocumentTargetType.DEVICE,
                documentType as DocumentType,
              );
            }
            for (const file of files[field]) {
              try {
                await this.documentUploadsService.upload(
                  existingDevice.id,
                  DocumentTargetType.DEVICE,
                  documentType as DocumentType,
                  file,
                  projectSubfolder,
                );
                this.uploadLogService.logFileUpload({
                  deviceId: existingDevice.id,
                  userId: user.id,
                  userEmail: user.email,
                  organizationId: user.organizationId,
                  actionType: UploadActionType.DocumentUpload,
                  fileName: file.originalname,
                  fileBuffer: file.buffer,
                  ipAddress: req.ip,
                  userAgent: req.headers['user-agent'],
                  metadata: { documentType: field },
                });
              } catch (error) {
                const msg =
                  error?.message ??
                  (typeof error === 'string' ? error : String(error));
                this.logger.error(
                  `Failed to upload ${field}: ${msg}`,
                  error?.stack,
                );
                throw new BadRequestException(
                  `Failed to upload ${field}: ${msg || 'Invalid file format or size'}`,
                );
              }
            }
          }
        }
      }
    }

    return result;
  }

  /**
   * It is DELETE api to delete an device by id
   * @param id is deviceId
   * @param param1 is getting organizationId and user role from user request
   * @returns {any}
   */
  /**
   * Admin-only bulk delete. Cascades through documents (incl. S3),
   * upload_log, e-signature/audit/AI logs, verification reports,
   * meter_reads / failed_meter_reads, certificate issue-date logs, and
   * submissions matching the siteName slug.
   */
  @Delete('/bulk')
  @UseGuards(AuthVerifiedGuard('jwt'), RolesGuard, PermissionGuard)
  @Permission('Delete')
  @ACLModules('DEVICE_MANAGEMENT_CRUDL')
  @Roles(Role.Admin)
  @ApiOperation({
    summary: 'Bulk delete devices (admin)',
    description:
      'Delete several devices in one call. Also removes their cached documents (S3) and related rows.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Bulk delete result.' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Admin only.' })
  public async bulkRemove(
    @Body() body: BulkDeleteDevicesDTO,
  ): Promise<any> {
    this.logger.verbose(`bulkRemove ids=${body.ids.join(',')}`);
    return this.deviceService.bulkRemove(body.ids);
  }

  @Delete('/:id')
  @UseGuards(AuthVerifiedGuard('jwt'), RolesGuard, PermissionGuard)
  @Permission('Delete')
  @ACLModules('DEVICE_MANAGEMENT_CRUDL')
  @Roles(Role.Registrant, Role.Admin)
  @ApiOperation({
    summary: 'Delete device by ID',
    description: 'Remove a device from the system using its ID.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully deleted the device.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The specified device does not exist.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have permission to delete this device.',
  })
  public async remove(
    @Param('id') id: number,
    @UserDecorator() { organizationId, role }: ILoggedInUser,
  ): Promise<any> {
    this.logger.verbose(`With in remove`);
    const checkIsUnGroup = await this.deviceService.findUngroupedById(id);
    if (checkIsUnGroup) {
      let filterOptions: any;
      if (role === 'Admin') {
        filterOptions = {
          groupId: null,
        };
      } else {
        filterOptions = {
          groupId: null,
          organizationId: organizationId,
        };
      }
      return await this.deviceService.remove(id, filterOptions);
    }
  }

  /**
   * It is GET api to list all total amount of reads by each devices grouped by organization
   * @param param0 is getting organizationId from user request.
   * @returns {Array<DeviceDTO>}
   */
  @Get('/my/totalamountread')
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Read')
  @ACLModules('DEVICE_MANAGEMENT_CRUDL')
  @ApiOperation({
    summary: 'Retrieve total reads by devices',
    description:
      'Fetch total read for devices owned by the user, grouped by organization.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Successfully retrieved total read for the user's devices.",
    type: [DeviceDTO],
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have permission to view total read.',
  })
  async getMyDevicesTotal(
    @UserDecorator() { organizationId }: ILoggedInUser,
  ): Promise<DeviceDTO[]> {
    this.logger.verbose(`Wth in getMyDevicesTotal`);
    return await this.deviceService.getOrganizationDevicesTotal(organizationId);
  }

  /**
   * It is PUT api tp update the device onboarding date by deviceId
   * @param param0 is getting organizationId from user request
   * @param deviceId is deviceId from device unique identifier
   * @param givenDate is new onboarding date to be updated.
   * @returns {}
   */
  @Put('/my/deviceOnBoardingDate')
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Write')
  @ACLModules('DEVICE_MANAGEMENT_CRUDL')
  @ApiOperation({
    summary: 'Update device onboarding date',
    description: 'Change the onboarding date of a device using its ID.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully updated the onboarding date of the device.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have permission to update the onboarding date.',
  })
  @ApiQuery({ name: 'deviceId', description: 'Device Id' })
  @ApiQuery({
    name: 'givenDate',
    description: 'Update the OnBoarding date',
    type: Date,
  })
  async changeOnBoardingDate(
    @UserDecorator() { organizationId }: ILoggedInUser,
    @Query('deviceId') serialNumber: string,
    @Query('givenDate') givenDate: string,
  ): Promise<string> {
    this.logger.verbose(`With in changeOnBoardingDate`);
    if (process.env.MODE != 'dev') {
      this.logger.error(`Currently not in dev environment`);
      throw new HttpException('Currently not in dev environment', 400);
    }
    // externalId → siteName (if uniquely scoped to org) → serialNumber (deprecated)
    const device: DeviceDTO | null = await this.deviceService.resolveDeviceKey(
      serialNumber,
      organizationId,
    );
    if (!device) {
      this.logger.error(`Device doesn't exist`);
      throw new HttpException("Device doesn't exist", 400);
    }
    this.logger.debug(
      'THE DEVICE FROM ExTERNALID IS::::::::::::' + device.externalId,
    );
    const deviceExternalId = device.externalId;
    const deviceOnboardedDate = device.createdAt;
    return this.deviceService.changeDeviceCreatedAt(
      deviceExternalId,
      deviceOnboardedDate,
      givenDate,
    );
  }

  /**
   * It is GET api to list all devices with auto complete
   * @param param0 is getting organizationId from user request
   * @param externalId is unique identoifier of an device
   * @returns {}
   */
  @Get('/my/autocomplete')
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Read')
  @ACLModules('DEVICE_MANAGEMENT_CRUDL')
  @ApiOperation({
    summary: 'Auto-complete device search',
    description:
      'Fetch devices based on a partial external identifier for auto-completion.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved auto-complete results for devices.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description:
      'User does not have permission to access auto-complete results.',
  })
  @ApiQuery({ name: 'externalId', description: 'externalId', type: String })
  async autoComplete(
    @UserDecorator() { organizationId }: ILoggedInUser,
    @Query('externalId') externalId: string,
  ): Promise<any> {
    this.logger.verbose(`With in autocomplete`);
    return await this.deviceService.atto(organizationId, externalId);
  }

  /**
   * It is GET api to fetch the certified device records with in the range of date
   * @param user is loggedIn user at request
   * @param pageNumber
   * @param externalId is unique identifier of device
   * @param groupId
   * @returns {any}
   */
  @Get('/certifiedlog/first&lastdate')
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Read')
  @ACLModules('DEVICE_MANAGEMENT_CRUDL')
  @ApiQuery({ name: 'externalId', type: Number, required: false })
  @ApiQuery({ name: 'pagenumber', type: Number, required: false })
  @ApiOperation({
    summary: 'Fetch certified device records by date range',
    description:
      'Retrieve certified device records within a specified date range.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved certified log date range for devices.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have permission to access certified logs.',
  })
  async certifiedLogDateRange(
    @UserDecorator() user: ILoggedInUser,
    @Query('groupUid', ParseUUIDPipe) groupId: string,
    @Query('pagenumber') pageNumber: number,
    @Query('externalId') externalId?: number,
  ): Promise<any> {
    this.logger.verbose(`With in certifiedLogDateRange`);

    const group: DeviceGroup | null = await this.deviceGroupService.findOne({
      deviceGroupUid: groupId,
    });
    assertUserCanAccessGroup(group, user);
    if (externalId != null || externalId != undefined) {
      const device: DeviceDTO | null =
        await this.deviceService.findOne(externalId);
      if (device === null) {
        this.logger.error(`device not found, invalid value was sent`);
        throw new ConflictException({
          success: false,
          message: 'device not found, invalid value was sent',
        });
      }
      return await this.deviceService.getCertifiedDeviceDateRange(
        group.id,
        device,
      );
    } else {
      return await this.deviceService.getCertifiedDeviceDateRangeByGroupId(
        group.id,
        pageNumber,
      );
    }
  }
}

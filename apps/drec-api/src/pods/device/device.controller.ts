import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UnauthorizedException,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';

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
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { fileFilter } from '../../validations/file';
import { parseMetadata } from '../../lib/helpers/parseMetadata';
import {
  DocumentType,
  DocumentTargetType,
} from '../document-uploads/entities/documents.entity';
import { DocumentUploadsService } from '../document-uploads/document-uploads.service';
import { validateOrReject } from 'class-validator';
import { ReadsService } from '../reads/reads.service';

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
  ) {}

  /**
   * It is GET api to list all devices with paginatiion and fiteration by organization and filterationDTO
   */
  @Get()
  @UseGuards(AuthVerifiedGuard('jwt'), RolesGuard, PermissionGuard)
  @Roles(Role.Admin, Role.ApiUser)
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
  @Roles(Role.OrganizationAdmin, Role.ApiUser)
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
    if (role === Role.ApiUser) {
      if (organization.api_user_id != api_user_id) {
        this.logger.error(
          `The requested organization is belongs to other apiuser`,
        );
        throw new UnauthorizedException({
          success: false,
          message: `The requested organization is belongs to other apiuser`,
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
  @Roles(Role.OrganizationAdmin, Role.ApiUser)
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
      if (role === Role.ApiUser) {
        const organization = await this.organizationService.findOne(
          filterDTO.organizationId,
        );
        const orgUser = await this.userService.findByEmail(
          organization.orgEmail,
        );
        if (organization.api_user_id != api_user_id) {
          this.logger.error(
            `The organization Id in param is belongs to other apiuser`,
          );
          throw new UnauthorizedException({
            success: false,
            message: 'The organization Id in param is belongs to other apiuser',
          });
        } else {
          if (orgUser.role != Role.OrganizationAdmin) {
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
  ): Promise<DeviceDTO | null> {
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
    return deviceData;
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

    if (loginUser.role === Role.ApiUser || loginUser.role === Role.Admin) {
      if (loginUser.role === Role.Admin) {
        loginUser.api_user_id = null;
      }

      deviceData = await this.deviceService.findBySerialNumberAndApiUser(
        serialNumber,
        loginUser.api_user_id,
      );
    } else {
      deviceData = await this.deviceService.findBySerialNumber(
        serialNumber,
        loginUser.organizationId,
      );
    }
    delete deviceData['developerExternalId'];
    return deviceData;
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
  @Roles(Role.OrganizationAdmin, Role.ApiUser)
  @Permission('Write')
  @ACLModules('DEVICE_MANAGEMENT_CRUDL')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: DocumentType.FORM_SF_02, maxCount: 10 },
        { name: DocumentType.SF_02C, maxCount: 10 },
        { name: DocumentType.METERING_EVIDENCE, maxCount: 10 },
        { name: DocumentType.SINGLE_LINE_DIAGRAM, maxCount: 10 },
        { name: DocumentType.PROJECT_PHOTOS, maxCount: 10 },
        { name: DocumentType.COD_PROOF, maxCount: 10 },
      ],
      {
        fileFilter: fileFilter,
      },
    ),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Device registration with documents',
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
    @UserDecorator() { organizationId, role, api_user_id }: ILoggedInUser,
    @Body() body: DeviceRegistrationBody,
    @UploadedFiles()
    files: DeviceFiles,
  ): Promise<DeviceDTO> {
    this.logger.verbose(`With in create`);
    const deviceToRegister = parseMetadata(
      body.deviceToRegister as unknown as Record<string, unknown>,
    );
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
    if (role === Role.Admin || role === Role.ApiUser) {
      if (deviceToRegister.organizationId) {
        this.logger.debug('Line No: 314');
        organizationId = deviceToRegister.organizationId;
      } else {
        this.logger.error(
          `Organization id is required,please add your developer's Organization`,
        );
        throw new ConflictException({
          success: false,
          message: `Organization id is required,please add your developer's Organization `,
        });
      }
    } else {
      const organization = await this.organizationService.findOne(
        deviceToRegister.organizationId,
      );
      api_user_id = organization.api_user_id;
    }
    const allFileTypes = [
      DocumentType.FORM_SF_02,
      DocumentType.SF_02C,
      DocumentType.METERING_EVIDENCE,
      DocumentType.SINGLE_LINE_DIAGRAM,
      DocumentType.PROJECT_PHOTOS,
      DocumentType.COD_PROOF,
    ];
    const missingFiles = allFileTypes.filter((fileType) => {
      const fileArray = files[fileType];
      return !Array.isArray(fileArray) || fileArray.length === 0;
    });

    if (missingFiles.length > 0) {
      throw new BadRequestException(
        `Missing required file types: ${missingFiles.join(', ')}`,
      );
    }
    return await this.deviceService.register(
      organizationId,
      deviceToRegister,
      files,
      api_user_id,
      role,
    );
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
        { name: DocumentType.METERING_EVIDENCE, maxCount: 10 },
        { name: DocumentType.SINGLE_LINE_DIAGRAM, maxCount: 10 },
        { name: DocumentType.PROJECT_PHOTOS, maxCount: 10 },
        { name: DocumentType.COD_PROOF, maxCount: 10 },
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
  ): Promise<DeviceDTO> {
    this.logger.verbose(`With in update`);
    // When sent as multipart/form-data (files attached), body.deviceToUpdate is a JSON string.
    // When sent as application/json (no files), body IS the device data directly.
    const deviceToUpdate = (
      body.deviceToUpdate != null
        ? parseMetadata(body.deviceToUpdate as unknown as Record<string, unknown>)
        : body
    ) as UpdateDeviceDTO;
    if (!deviceToUpdate)
      throw new BadRequestException('Invalid device data format');
    const deviceDtoInstance = plainToClass(UpdateDeviceDTO, deviceToUpdate);
    try {
      await validateOrReject(deviceDtoInstance, { skipMissingProperties: true });
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

    await this.organizationService.checkIfCanManage({
      user,
      organizationId: deviceToUpdate.organizationId,
    });
    user.organizationId = deviceToUpdate.organizationId;
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
      const checkSerialNumber = await this.deviceService.findBySerialNumber(
        serialNumber,
        user.organizationId,
      );
      const noOfHistRead: number =
        await this.deviceService.getNumberOfHistoryReads(
          checkSerialNumber.serialNumber,
        );
      const noOfOnGoingRead: number =
        await this.readsService.countOngoingReadsSinceDeviceOnboardingDate(
          checkSerialNumber.serialNumber,
          checkSerialNumber.createdAt,
        );

      if (
        deviceToUpdate.commissioningDate != checkSerialNumber.commissioningDate
      ) {
        if (noOfHistRead > 0 || noOfOnGoingRead > 0) {
          this.logger.error(
            `Commissioning date cannot be changed due to existing meter reads available for ${checkSerialNumber.serialNumber}`,
          );
          throw new ConflictException({
            success: false,
            message: ` Commissioning date cannot be changed due to existing meter reads available for ${checkSerialNumber.serialNumber}`,
          });
        }
      }
    }
    const result = await this.deviceService.update(
      user.organizationId,
      user.role,
      serialNumber,
      deviceToUpdate,
    );

    if (files) {
      const existingDevice = await this.deviceService.findBySerialNumber(
        result.serialNumber || serialNumber,
        user.organizationId,
      );

      if (existingDevice) {
        const documentTypes = {
          [DocumentType.FORM_SF_02]: DocumentType.FORM_SF_02,
          [DocumentType.SF_02C]: DocumentType.SF_02C,
          [DocumentType.METERING_EVIDENCE]: DocumentType.METERING_EVIDENCE,
          [DocumentType.SINGLE_LINE_DIAGRAM]: DocumentType.SINGLE_LINE_DIAGRAM,
          [DocumentType.PROJECT_PHOTOS]: DocumentType.PROJECT_PHOTOS,
          [DocumentType.COD_PROOF]: DocumentType.COD_PROOF,
        };

        const projectName = (existingDevice.projectName || 'project')
          .replace(/[^a-zA-Z0-9-_]/g, '-')
          .toLowerCase();
        const projectSubfolder = `${projectName}-${existingDevice.id}`;

        for (const [field, documentType] of Object.entries(documentTypes)) {
          if (files[field] && Array.isArray(files[field])) {
            for (const file of files[field]) {
              try {
                await this.documentUploadsService.upload(
                  existingDevice.id,
                  DocumentTargetType.DEVICE,
                  documentType as DocumentType,
                  file,
                  projectSubfolder,
                );
              } catch (error) {
                this.logger.error(
                  `Failed to upload ${field}: ${error.message}`,
                );
                throw new BadRequestException(
                  `Failed to upload ${field}: ${error.message || 'Invalid file format or size'}`,
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
  @Delete('/:id')
  @UseGuards(AuthVerifiedGuard('jwt'), RolesGuard, PermissionGuard)
  @Permission('Delete')
  @ACLModules('DEVICE_MANAGEMENT_CRUDL')
  @Roles(Role.OrganizationAdmin, Role.Admin)
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
    const device: DeviceDTO | null =
      await this.deviceService.findBySerialNumber(serialNumber, organizationId);
    this.logger.debug(
      'THE DEVICE FROM ExTERNALID IS::::::::::::' + device.externalId,
    );
    if (!device) {
      this.logger.error(`Device dosen't exist`);
      throw new HttpException("Device dosen't exist", 400);
    }
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
    if (
      group === null ||
      (group.organizationId != user.organizationId && user.role != 'ApiUser') ||
      group.api_user_id != user.api_user_id
    ) {
      this.logger.error(
        `Group UId is not of this buyer, invalid value was sent`,
      );
      throw new ConflictException({
        success: false,
        message: 'Group UId is not of this buyer, invalid value was sent',
      });
    }
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

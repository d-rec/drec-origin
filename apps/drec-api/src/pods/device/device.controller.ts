import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  HttpStatus,
  Param,
  Body,
  UseGuards,
  ValidationPipe,
  Query,
  ConflictException,
  HttpException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiResponse,
  ApiOkResponse,
  ApiSecurity,
  ApiTags,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { plainToClass } from 'class-transformer';

import { DeviceService } from './device.service';
import {
  FilterDTO,
  NewDeviceDTO,
  UpdateDeviceDTO,
  DeviceDTO,
  DeviceGroupByDTO,
  GroupedDevicesDTO,
} from './dto';
import { CSVBulkUploadDTO } from '../device-group/dto';
import { Role } from '../../utils/enums';
import { RolesGuard } from '../../guards/RolesGuard';
import { PermissionGuard } from '../../guards/PermissionGuard';
import { ILoggedInUser } from '../../models';
import { CodeNameDTO } from './dto/code-name.dto';
import { ActiveUserGuard } from '../../guards';
import { Roles } from '../user/decorators/roles.decorator';
import { UserDecorator } from '../user/decorators/user.decorator';
import { DeviceGroupService } from '../device-group/device-group.service';
import { Permission } from '../permission/decorators/permission.decorator';
import { ACLModules } from '../access-control-layer-module-service/decorator/aclModule.decorator';
import { countryCodesList } from '../../models/country-code';
import { isValidUTCDateFormat } from '../../utils/checkForISOStringFormat';
import { DeviceGroup } from '../device-group/device-group.entity';
import {
  DeviceCsvFileProcessingJobsEntity,
  StatusCSV,
} from '../device-group/device_csv_processing_jobs.entity';
import { Device } from './device.entity';
import { OrganizationService } from '../organization/organization.service';
import { UserService } from '../user/user.service';
import { FindOneOptions } from 'typeorm';

/**
 * It is Controller of device with the endpoints of device operations.
 */
@ApiTags('device')
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
  ) {}

  /**
   * It is GET api to list all devices with paginatiion and fiteration by organization and filterationDto
   */
  @Get()
  @UseGuards(AuthGuard('jwt'), ActiveUserGuard, RolesGuard, PermissionGuard)
  @Roles(Role.Admin)
  @Permission('Read')
  @ACLModules('DEVICE_MANAGEMENT_CRUDL')
  @ApiQuery({ name: 'pagenumber', type: Number, required: false })
  @ApiQuery({ name: 'OrganizationId', type: Number, required: false })
  @ApiOkResponse({ type: [DeviceDTO], description: 'Returns all Devices' })
  async getAll(
    @Query(ValidationPipe) filterDto: FilterDTO,
    @Query('pagenumber') pagenumber: number | null,
    @Query('OrganizationId') OrgId: number | null,
  ): Promise<{ devices: Device[]; currentPage; totalPages; totalCount }> {
    this.logger.verbose(`With in getAll`);
    return this.deviceService.find(filterDto, pagenumber, OrgId);
  }

  /**
   * It is GET api to list all devices for reservation
   * @return {Array<DeviceDTO>} return array of devices for reservation
   */
  @Get('/ungrouped/buyerreservation')
  @UseGuards(
    AuthGuard(['jwt', 'oauth2-client-password']),
    PermissionGuard,
    RolesGuard,
  )
  @Permission('Read')
  @ACLModules('DEVICE_MANAGEMENT_CRUDL')
  @Roles(Role.Buyer, Role.SubBuyer, Role.ApiUser)
  @ApiOkResponse({ type: [DeviceDTO], description: 'Returns all Devices' })
  async getAllDeviceForBuyer(
    @Query(ValidationPipe) filterDto: FilterDTO,
    @Query('pagenumber') pagenumber: number | null,
    @UserDecorator() { organizationId, api_user_id, role }: ILoggedInUser,
  ): Promise<DeviceDTO[]> {
    this.logger.verbose(`With in getAllDeviceForBuyer`);
    if (filterDto.organizationId) {
      const organization = await this.organizationService.findOne(
        filterDto.organizationId,
      );
      const orguser = await this.userService.findByEmail(organization.orgEmail);
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

        if (
          orguser.role === Role.OrganizationAdmin ||
          orguser.role === Role.DeviceOwner
        ) {
          this.logger.error(
            `Unauthorized... The requested user is developer or device owner`,
          );
          throw new UnauthorizedException({
            success: false,
            message: `Unauthorized`,
          });
        }
      } else {
        if (organizationId != organization.id) {
          this.logger.error(
            `The requested organization is not same as user's organization`,
          );
          throw new UnauthorizedException({
            success: false,
            message: `The requested organization is not same as user's organization`,
          });
        }
      }
    }

    if (role !== Role.ApiUser) {
      api_user_id = null;
    }

    return this.deviceService.finddeviceForBuyer(
      filterDto,
      pagenumber,
      api_user_id,
    );
  }

  /**
   * It is GET api to list all ungrouped devices with filteration
   * @return {GroupedDevicesDTO} returns ungrouped devices
   */
  @Get('/ungrouped')
  @UseGuards(AuthGuard('jwt'), ActiveUserGuard, RolesGuard, PermissionGuard)
  @Roles(Role.Admin, Role.DeviceOwner)
  @Permission('Read')
  @ACLModules('DEVICE_MANAGEMENT_CRUDL')
  @ApiOkResponse({
    type: [GroupedDevicesDTO],
    description: 'Returns all ungrouped Devices',
  })
  async getAllUngrouped(
    @UserDecorator() { organizationId }: ILoggedInUser,
    @Query(ValidationPipe) orderFilterDto: DeviceGroupByDTO,
  ): Promise<GroupedDevicesDTO[]> {
    this.logger.verbose(`With in getAllUngrouped`);
    return this.deviceService.findUngrouped(organizationId, orderFilterDto);
  }

  /**
   * It is GET to list all device code types in dropdown
   * @returns {Array<CodeNameDTO>}
   */
  @Get('/device-type')
  @ApiResponse({
    status: HttpStatus.OK,
    type: [CodeNameDTO],
    description: 'Returns all IREC device types',
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
  @ApiResponse({
    status: HttpStatus.OK,
    type: [CodeNameDTO],
    description: 'Returns all IREC fuel types',
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
    AuthGuard(['jwt', 'oauth2-client-password']),
    ActiveUserGuard,
    PermissionGuard,
  )
  @Permission('Read')
  @ACLModules('DEVICE_MANAGEMENT_CRUDL')
  @ApiQuery({ name: 'pagenumber', type: Number, required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [DeviceDTO],
    description: 'Returns my Devices',
  })
  async getMyDevices(
    @Query(ValidationPipe) filterDto: FilterDTO,
    @UserDecorator() { organizationId, api_user_id, role }: ILoggedInUser,
    @Query('pagenumber') pagenumber: number | null,
  ): Promise<any> {
    this.logger.verbose(`With in getMyDevices`);
    if (filterDto.country) {
      filterDto.country = filterDto.country.toUpperCase();

      if (
        filterDto.country &&
        typeof filterDto.country === 'string' &&
        filterDto.country.length === 3
      ) {
        const countries = countryCodesList;
        if (
          countries.find((ele) => ele.countryCode === filterDto.country) ===
          undefined
        ) {
          this.logger.error(
            `Invalid countryCode, some of the valid country codes are "GBR" - "United Kingdom of Great Britain and Northern Ireland",  "CAN" - "Canada"  "IND" - "India", "DEU"-  "Germany"`,
          );
          return new Promise((resolve, reject) => {
            reject(
              new ConflictException({
                success: false,
                message:
                  ' Invalid countryCode, some of the valid country codes are "GBR" - "United Kingdom of Great Britain and Northern Ireland",  "CAN" - "Canada"  "IND" - "India", "DEU"-  "Germany"',
              }),
            );
          });
        }
      } else {
        this.logger.error(
          `Invalid countryCode, some of the valid country codes are "GBR" - "United Kingdom of Great Britain and Northern Ireland",  "CAN" - "Canada"  "IND" - "India", "DEU"-  "Germany"`,
        );
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message:
                ' Invalid countryCode, some of the valid country codes are "GBR" - "United Kingdom of Great Britain and Northern Ireland",  "CAN" - "Canada"  "IND" - "India", "DEU"-  "Germany"',
            }),
          );
        });
      }
    }
    if (filterDto.organizationId) {
      if (role === Role.ApiUser) {
        const organization = await this.organizationService.findOne(
          filterDto.organizationId,
        );
        const orguser = await this.userService.findByEmail(
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
          if (orguser.role != Role.OrganizationAdmin) {
            this.logger.error(`Unauthorized`);
            throw new UnauthorizedException({
              success: false,
              message: 'Unauthorized',
            });
          }
        }
      } else {
        if (filterDto.organizationId != organizationId) {
          this.logger.error(
            `The organization Id in param should be same as user's organization`,
          );
          throw new UnauthorizedException({
            success: false,
            message: `The organization Id in param should be same as user's organization`,
          });
        }
      }

      organizationId = filterDto.organizationId;
    }

    this.logger.log('In devices before calling service');
    return await this.deviceService.getOrganizationDevices(
      organizationId,
      api_user_id,
      role,
      filterDto,
      pagenumber,
    );
  }

  /**
   * It is GET api to fetch an device by the deviceId in param
   * @param id is deviceId in type number
   * @returns {DeviceDTO | null} DeviceDto for success response and null when there is no device found by the id
   */
  @Get('/:id')
  @UseGuards(
    AuthGuard(['jwt', 'oauth2-client-password']),
    ActiveUserGuard,
    PermissionGuard,
  )
  @Permission('Read')
  @ACLModules('DEVICE_MANAGEMENT_CRUDL')
  @ApiQuery({ name: 'apiUserId', type: String, required: false })
  @ApiQuery({ name: 'organizationId', type: Number, required: false })
  @ApiOkResponse({ type: DeviceDTO, description: 'Returns a Device' })
  @ApiNotFoundResponse({
    description: `The device with the code doesn't exist`,
  })
  async get(
    @Param('id') id: number,
    @Query('apiUserId') api_user_id: string | null,
    @Query('organizationId') organizationId: number | null,
  ): Promise<DeviceDTO | null> {
    this.logger.verbose(`With in get`);
    let devicedata: Device;
    if (api_user_id && organizationId) {
      devicedata = await this.deviceService.findOne(id, {
        api_user_id: api_user_id,
        organizationId: organizationId,
      } as FindOneOptions<Device>);
    } else {
      devicedata = await this.deviceService.findOne(id);
    }
    return devicedata;
  }

  /**
   * It is GET api to fetch an device by externalId in param
   * @param id  is externalId in device
   * @param param1
   * @returns {DeviceDTO | null} DeviceDto for success response and null when there is no device found by the id
   */
  @Get('externalId/:id')
  @UseGuards(AuthGuard('jwt'), PermissionGuard)
  @Permission('Read')
  @ACLModules('DEVICE_MANAGEMENT_CRUDL')
  @ApiOkResponse({ type: DeviceDTO, description: 'Returns a Device' })
  @ApiNotFoundResponse({
    description: `The device with the code doesn't exist`,
  })
  async getByExternalId(
    @Param('id') id: string,
    @UserDecorator() loginUser: ILoggedInUser,
  ): Promise<DeviceDTO | null> {
    this.logger.verbose(`With in getByExternalId`);
    let devicedata: Device;

    if (loginUser.role === Role.ApiUser || loginUser.role === Role.Admin) {
      if (loginUser.role === Role.Admin) {
        loginUser.api_user_id = null;
      }

      devicedata =
        await this.deviceService.findDeviceByDeveloperExternalIByApiUser(
          id,
          loginUser.api_user_id,
        );
    } else {
      devicedata = await this.deviceService.findDeviceByDeveloperExternalId(
        id,
        loginUser.organizationId,
      );
    }
    devicedata.externalId = devicedata.developerExternalId;
    delete devicedata['developerExternalId'];
    return devicedata;
  }

  /**
   * It is POST api to create an device
   * @param param0 It is organizationId from user at request
   * @param deviceToRegister It is body payload to create device
   * @returns {DeviceDTO}
   */
  @Post()
  @UseGuards(AuthGuard(['jwt', 'oauth2-client-password']), PermissionGuard)
  @Permission('Write')
  @ACLModules('DEVICE_MANAGEMENT_CRUDL')
  @ApiResponse({
    status: HttpStatus.OK,
    type: NewDeviceDTO,
    description: 'Returns a new created Device id',
  })
  public async create(
    @UserDecorator() { organizationId, role, api_user_id }: ILoggedInUser,
    @Body() deviceToRegister: NewDeviceDTO,
  ): Promise<DeviceDTO> {
    this.logger.verbose(`With in create`);
    deviceToRegister.externalId = deviceToRegister.externalId.trim();
    if (deviceToRegister.externalId.trim() === '') {
      this.logger.error(`externalId should not be empty`);
      return new Promise((resolve, reject) => {
        reject(
          new ConflictException({
            success: false,
            message: `externalId should not be empty`,
          }),
        );
      });
    }

    if (!isValidUTCDateFormat(deviceToRegister.commissioningDate)) {
      this.logger.error(
        `Invalid commissioning date, valid format is  YYYY-MM-DDThh:mm:ss.millisecondsZ example 2022-10-18T11:35:27.640Z`,
      );
      return new Promise((resolve, reject) => {
        reject(
          new ConflictException({
            success: false,
            message:
              ' Invalid commissioning date, valid format is  YYYY-MM-DDThh:mm:ss.millisecondsZ example 2022-10-18T11:35:27.640Z ',
          }),
        );
      });
    }
    if (
      new Date(deviceToRegister.commissioningDate).getTime() >
      new Date().getTime()
    ) {
      this.logger.error(
        `Invalid commissioning date, commissioning is greater than current date`,
      );
      return new Promise((resolve, reject) => {
        reject(
          new ConflictException({
            success: false,
            message: ` Invalid commissioning date, commissioning is greater than current date`,
          }),
        );
      });
    }
    if (deviceToRegister['groupId'] === 0 || deviceToRegister['groupId']) {
      deviceToRegister['groupId'] = null;
    }
    deviceToRegister.countryCode = deviceToRegister.countryCode.toUpperCase();
    if (
      deviceToRegister.countryCode &&
      typeof deviceToRegister.countryCode === 'string' &&
      deviceToRegister.countryCode.length === 3
    ) {
      const countries = countryCodesList;
      if (
        countries.find(
          (ele) => ele.countryCode === deviceToRegister.countryCode,
        ) === undefined
      ) {
        this.logger.error(
          `Invalid countryCode, some of the valid country codes are "GBR" - "United Kingdom of Great Britain and Northern Ireland",  "CAN" - "Canada"  "IND" - "India", "DEU"-  "Germany"`,
        );
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message:
                ' Invalid countryCode, some of the valid country codes are "GBR" - "United Kingdom of Great Britain and Northern Ireland",  "CAN" - "Canada"  "IND" - "India", "DEU"-  "Germany"',
            }),
          );
        });
      }
    } else {
      this.logger.error(
        `Invalid countryCode, some of the valid country codes are "GBR" - "United Kingdom of Great Britain and Northern Ireland",  "CAN" - "Canada"  "IND" - "India", "DEU"-  "Germany"`,
      );
      return new Promise((resolve, reject) => {
        reject(
          new ConflictException({
            success: false,
            message:
              ' Invalid countryCode, some of the valid country codes are "GBR" - "United Kingdom of Great Britain and Northern Ireland",  "CAN" - "Canada"  "IND" - "India", "DEU"-  "Germany"',
          }),
        );
      });
    }
    if (isNaN(parseFloat(deviceToRegister.capacity.toString()))) {
      this.logger.error(`Invalid Capacity or energy Storage Capacity`);
      return new Promise((resolve, reject) => {
        reject(
          new ConflictException({
            success: false,
            message: ' Invalid Capacity or energy Storage Capacity',
          }),
        );
      });
    }
    if (
      deviceToRegister.capacity <= 0 ||
      deviceToRegister.energyStorageCapacity < 0
    ) {
      this.logger.error(
        `Invalid Capacity or energy Storage Capacity, it should be greater than 0`,
      );
      return new Promise((resolve, reject) => {
        reject(
          new ConflictException({
            success: false,
            message:
              ' Invalid Capacity or energy Storage Capacity, it should be greater than 0',
          }),
        );
      });
    }
    if (
      deviceToRegister.version === null ||
      deviceToRegister.version === undefined ||
      deviceToRegister.version === '0'
    ) {
      deviceToRegister.version = '1.0';
    }
    if (role === Role.Admin || role === Role.ApiUser) {
      if (deviceToRegister.organizationId) {
        this.logger.debug('Line No: 314');
        organizationId = deviceToRegister.organizationId;
      } else {
        this.logger.error(
          `Organization id is required,please add your developer's Organization`,
        );
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message: `Organization id is required,please add your developer's Organization `,
            }),
          );
        });
      }
    }
    return await this.deviceService.register(
      organizationId,
      deviceToRegister,
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
  @UseGuards(AuthGuard('jwt'), PermissionGuard)
  @Permission('Update')
  @ACLModules('DEVICE_MANAGEMENT_CRUDL')
  @ApiResponse({
    status: HttpStatus.OK,
    type: UpdateDeviceDTO,
    description: 'Returns an updated Device',
  })
  @ApiNotFoundResponse({ description: `No device found` })
  public async update(
    @UserDecorator() user: ILoggedInUser,
    @Param('externalId') externalId: string,
    @Body() deviceToUpdate: UpdateDeviceDTO,
  ): Promise<DeviceDTO> {
    this.logger.verbose(`With in update`);

    if (
      deviceToUpdate.organizationId != null &&
      deviceToUpdate.organizationId != undefined &&
      deviceToUpdate.organizationId
    ) {
      const org = await this.organizationService.findOne(
        deviceToUpdate.organizationId,
      );
      if (user.role === Role.ApiUser) {
        if (
          user.api_user_id != org.api_user_id ||
          org.organizationType != 'Developer'
        ) {
          this.logger.error(`Unauthorized`);
          throw new UnauthorizedException({
            success: false,
            message: 'Unauthorized',
          });
        } else {
          user.organizationId = deviceToUpdate.organizationId;
        }
      } else {
        if (user.role != Role.Admin && user.organizationId != org.id) {
          this.logger.error(`Unauthorized`);
          throw new UnauthorizedException({
            success: false,
            message: 'Unauthorized',
          });
        } else if (user.role === Role.Admin) {
          user.organizationId = deviceToUpdate.organizationId;
        }
      }
    }

    if (deviceToUpdate.externalId) {
      deviceToUpdate.externalId = deviceToUpdate.externalId.trim();
      if (deviceToUpdate.externalId === '') {
        this.logger.error(`externalId should not be empty`);
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message: `externalId should not be empty`,
            }),
          );
        });
      }

      const checkexternalid =
        await this.deviceService.findDeviceByDeveloperExternalId(
          deviceToUpdate.externalId,
          user.organizationId,
        );
      if (
        checkexternalid != undefined &&
        checkexternalid.developerExternalId === externalId.trim()
      ) {
        this.logger.log('Line No: 236');
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message: `ExternalId already exist in this organization, can't update with same external id ${deviceToUpdate.externalId}`,
            }),
          );
        });
      }
    }

    if (deviceToUpdate.countryCode != undefined) {
      deviceToUpdate.countryCode = deviceToUpdate.countryCode.toUpperCase();
      if (
        deviceToUpdate.countryCode &&
        typeof deviceToUpdate.countryCode === 'string' &&
        deviceToUpdate.countryCode.length === 3
      ) {
        const countries = countryCodesList;
        if (
          countries.find(
            (ele) => ele.countryCode === deviceToUpdate.countryCode,
          ) === undefined
        ) {
          this.logger.error(
            `Invalid countryCode, some of the valid country codes are "GBR" - "United Kingdom of Great Britain and Northern Ireland",  "CAN" - "Canada"  "IND" - "India", "DEU"-  "Germany"`,
          );
          return new Promise((resolve, reject) => {
            reject(
              new ConflictException({
                success: false,
                message:
                  ' Invalid countryCode, some of the valid country codes are "GBR" - "United Kingdom of Great Britain and Northern Ireland",  "CAN" - "Canada"  "IND" - "India", "DEU"-  "Germany"',
              }),
            );
          });
        }
      } else {
        this.logger.error(
          `Invalid countryCode, some of the valid country codes are "GBR" - "United Kingdom of Great Britain and Northern Ireland",  "CAN" - "Canada"  "IND" - "India", "DEU"-  "Germany"`,
        );
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message:
                ' Invalid countryCode, some of the valid country codes are "GBR" - "United Kingdom of Great Britain and Northern Ireland",  "CAN" - "Canada"  "IND" - "India", "DEU"-  "Germany"',
            }),
          );
        });
      }
    }

    if (deviceToUpdate.capacity <= 0) {
      this.logger.error(`Invalid Capacity, it should be greater than 0`);
      return new Promise((resolve, reject) => {
        reject(
          new ConflictException({
            success: false,
            message: ' Invalid Capacity, it should be greater than 0',
          }),
        );
      });
    }
    if (
      !isValidUTCDateFormat(deviceToUpdate.commissioningDate) &&
      deviceToUpdate.commissioningDate !== undefined
    ) {
      this.logger.error(
        `Invalid commissioning date, valid format is  YYYY-MM-DDThh:mm:ss.millisecondsZ example 2022-10-18T11:35:27.640Z`,
      );
      return new Promise((resolve, reject) => {
        reject(
          new ConflictException({
            success: false,
            message:
              ' Invalid commissioning date, valid format is  YYYY-MM-DDThh:mm:ss.millisecondsZ example 2022-10-18T11:35:27.640Z ',
          }),
        );
      });
    }
    if (
      new Date(deviceToUpdate.commissioningDate).getTime() >
      new Date().getTime()
    ) {
      this.logger.error(
        `Invalid commissioning date, commissioning is greater than current date`,
      );
      return new Promise((resolve, reject) => {
        reject(
          new ConflictException({
            success: false,
            message: ` Invalid commissioning date, commissioning is greater than current date`,
          }),
        );
      });
    }

    if (deviceToUpdate.commissioningDate) {
      const checkexternalid =
        await this.deviceService.findDeviceByDeveloperExternalId(
          externalId,
          user.organizationId,
        );
      const noOfHistRead: number =
        await this.deviceService.getNumberOfHistReads(
          checkexternalid.externalId,
        );
      const noOfOnGoingRead: number =
        await this.deviceService.getNumberOfOngReads(
          checkexternalid.externalId,
          checkexternalid.createdAt,
        );

      if (
        deviceToUpdate.commissioningDate != checkexternalid.commissioningDate
      ) {
        if (noOfHistRead > 0 || noOfOnGoingRead > 0) {
          this.logger.error(
            `Commissioning date cannot be changed due to existing meter reads available for ${checkexternalid.developerExternalId}`,
          );
          throw new ConflictException({
            success: false,
            message: ` Commissioning date cannot be changed due to existing meter reads available for ${checkexternalid.developerExternalId}`,
          });
        }

        if (
          new Date(deviceToUpdate.commissioningDate).getTime() >
          new Date(checkexternalid.createdAt).getTime()
        ) {
          this.logger.error(
            `Invalid commissioning date, commissioning is greater than device onboarding date`,
          );
          throw new ConflictException({
            success: false,
            message: `Invalid commissioning date, commissioning is greater than device onboarding date`,
          });
        }
      }
    }
    return await this.deviceService.update(
      user.organizationId,
      user.role,
      externalId,
      deviceToUpdate,
    );
  }

  /**
   * It is DELETE api to delete an device by id
   * @param id is deviceId
   * @param param1 is getting organizationId and user role from user request
   * @returns {any}
   */
  @Delete('/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionGuard)
  @Permission('Delete')
  @ACLModules('DEVICE_MANAGEMENT_CRUDL')
  @Roles(Role.OrganizationAdmin, Role.Admin)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Remove device group',
  })
  @ApiNotFoundResponse({ description: `No device group found` })
  public async remove(
    @Param('id') id: number,
    @UserDecorator() { organizationId, role }: ILoggedInUser,
  ): Promise<any> {
    this.logger.verbose(`With in remove`);
    const checkisungroup = this.deviceService.findUngroupedById(id);
    if (checkisungroup) {
      let fitlerop: any;
      if (role === 'Admin') {
        fitlerop = {
          groupId: null,
        };
      } else {
        fitlerop = {
          groupId: null,
          organizationId: organizationId,
        };
      }
      return await this.deviceService.remove(id, fitlerop);
    }
  }

  /**
   * It is GET api to list all total amount of reads by each devices grouped by organization
   * @param param0 is getting organizationId from user request.
   * @returns {Array<DeviceDTO>}
   */
  @Get('/my/totalamountread')
  @UseGuards(AuthGuard('jwt'), ActiveUserGuard, PermissionGuard)
  @Permission('Read')
  @ACLModules('DEVICE_MANAGEMENT_CRUDL')
  @ApiResponse({
    status: HttpStatus.OK,
    type: [DeviceDTO],
    description: 'Returns my Devices',
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
  @UseGuards(AuthGuard('jwt'), PermissionGuard)
  @Permission('Write')
  @ACLModules('DEVICE_MANAGEMENT_CRUDL')
  @ApiResponse({
    status: HttpStatus.OK,
    description: "change the device's OnBoarding date",
  })
  @ApiQuery({ name: 'deviceId', description: 'Device Id' })
  @ApiQuery({
    name: 'givenDate',
    description: 'Update the OnBoarding date',
    type: Date,
  })
  async changeOnBoardingDate(
    @UserDecorator() { organizationId }: ILoggedInUser,
    @Query('deviceId') deviceId: string,
    @Query('givenDate') givenDate: string,
  ): Promise<string> {
    this.logger.verbose(`With in changeOnBoardingDate`);
    if (process.env.MODE != 'dev') {
      this.logger.error(`Currently not in dev environment`);
      throw new HttpException('Currently not in dev environment', 400);
    }
    const device: DeviceDTO | null =
      await this.deviceService.findDeviceByDeveloperExternalId(
        deviceId,
        organizationId,
      );
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
  @UseGuards(AuthGuard('jwt'), ActiveUserGuard, PermissionGuard)
  @Permission('Read')
  @ACLModules('DEVICE_MANAGEMENT_CRUDL')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns Auto-Complete',
  })
  @ApiQuery({ name: 'externalId', description: 'externalId', type: String })
  async autocomplete(
    @UserDecorator() { organizationId }: ILoggedInUser,
    @Query('externalId') externalId: string,
  ): Promise<any> {
    this.logger.verbose(`With in autocomplete`);
    return await this.deviceService.atto(organizationId, externalId);
  }

  /**
   * It is GET api to fetch the certified device records with in the range of date
   * @param user is loggedIn user at request
   * @param externalId is unique identifier of device
   * @param groupuId
   * @returns {any}
   */
  @Get('/certifiedlog/first&lastdate')
  @UseGuards(AuthGuard('jwt'), PermissionGuard)
  @Permission('Read')
  @ACLModules('DEVICE_MANAGEMENT_CRUDL')
  @ApiQuery({ name: 'externalId', type: Number, required: false })
  @ApiQuery({ name: 'pagenumber', type: Number, required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns Certified log date rang of Device',
  })
  async certifiedlogdaterang(
    @UserDecorator() user: ILoggedInUser,
    @Query('groupUid') groupuId: string,
    @Query('pagenumber') pagenumber: number,
    @Query('externalId') externalId?: number,
  ): Promise<any> {
    this.logger.verbose(`With in certifiedlogdaterang`);
    const regexExp =
      /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/;
    if (groupuId === null || !regexExp.test(groupuId)) {
      this.logger.error(
        `Please Add the valid UID ,invalid group uid value was sent`,
      );
      return new Promise((resolve, reject) => {
        reject(
          new ConflictException({
            success: false,
            message:
              ' Please Add the valid UID ,invalid group uid value was sent',
          }),
        );
      });
    }

    const group: DeviceGroup | null = await this.deviceGroupService.findOne({
      devicegroup_uid: groupuId,
    });
    if (
      group === null ||
      (group.buyerId != user.id && user.role != 'ApiUser') ||
      group.api_user_id != user.api_user_id
    ) {
      this.logger.error(
        `Group UId is not of this buyer, invalid value was sent`,
      );
      return new Promise((resolve, reject) => {
        reject(
          new ConflictException({
            success: false,
            message: 'Group UId is not of this buyer, invalid value was sent',
          }),
        );
      });
    }
    if (externalId != null || externalId != undefined) {
      const device: DeviceDTO | null =
        await this.deviceService.findOne(externalId);
      if (device === null) {
        this.logger.error(`device not found, invalid value was sent`);
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message: 'device not found, invalid value was sent',
            }),
          );
        });
      }
      return await this.deviceService.getcertifieddevicedaterange(
        group.id,
        device,
      );
    } else {
      return await this.deviceService.getcertifieddevicedaterangeBygroupid(
        group.id,
        pagenumber,
      );
    }
  }

  /**
   * It is POST api to create array of devices by uploading csv files with device data
   * @param user is loggedIn user from request
   * @param organizationId is organization unique identifier with number type to map with the respective organization
   * @param fileToProcess is parsed data of uploaded csv file
   * @returns {DeviceCsvFileProcessingJobsEntity}
   */
  @Post('addByAdmin/process-creation-bulk-devices-csv/:organizationId')
  @UseGuards(AuthGuard(['jwt', 'oauth2-client-password']), PermissionGuard)
  @Permission('Write')
  @ACLModules('DEVICE_BULK_MANAGEMENT_CRUDL')
  @ApiResponse({
    status: HttpStatus.OK,
    type: [DeviceCsvFileProcessingJobsEntity],
    description: 'Returns created devices from csv',
  })
  @ApiBody({ type: CSVBulkUploadDTO })
  public async processCreationBulkFromCSV(
    @UserDecorator() user: ILoggedInUser,
    @Param('organizationId') organizationId: number | null,
    @Body() fileToProcess: CSVBulkUploadDTO,
  ): Promise<DeviceCsvFileProcessingJobsEntity> {
    this.logger.verbose(`With in processCreationBulkFromCSV`);
    if (organizationId === null || organizationId === undefined) {
      this.logger.error(`User needs to have organization added`);
      throw new ConflictException({
        success: false,
        message: 'User needs to have organization added',
      });
    }

    if (fileToProcess.fileName == undefined) {
      this.logger.error(`File Not Found`);
      throw new ConflictException({
        success: false,
        message: 'File Not Found',
      });
    }
    if (!fileToProcess.fileName.endsWith('.csv')) {
      this.logger.error(`Invalid file`);
      throw new ConflictException({
        success: false,
        message: 'Invalid file',
      });
    }

    let jobCreated: any;
    if (user.role === Role.ApiUser) {
      const organization =
        await this.organizationService.findOne(organizationId);
      const orguser = await this.userService.findByEmail(organization.orgEmail);
      if (organization.api_user_id != user.api_user_id) {
        this.logger.error(
          `The requested organization is belongs to other apiuser`,
        );
        throw new BadRequestException({
          success: false,
          message: 'The requested organization is belongs to other apiuser',
        });
      }

      if (orguser.role != Role.OrganizationAdmin) {
        this.logger.error(`Unauthorized`);
        throw new UnauthorizedException({
          success: false,
          message: 'Unauthorized',
        });
      }

      jobCreated = await this.deviceGroupService.createCSVJobForFile(
        user.id,
        organizationId,
        StatusCSV.Added,
        fileToProcess.fileName,
        user.api_user_id,
      );
    } else {
      jobCreated = await this.deviceGroupService.createCSVJobForFile(
        user.id,
        organizationId,
        StatusCSV.Added,
        fileToProcess.fileName,
      );
    }
    return jobCreated;
  }
}

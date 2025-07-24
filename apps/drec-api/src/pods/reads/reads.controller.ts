import {
  BaseReadsController,
  ReadsService as BaseReadsService,
  FilterDTO,
  ReadDTO,
} from '@energyweb/energy-api-influxdb';
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Logger,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import * as momentTimeZone from 'moment-timezone';
import { AuthVerifiedGuard, PermissionGuard } from '../../guards';
import { RolesGuard } from '../../guards/RolesGuard';
import { ILoggedInUser, IUser } from '../../models';
import { Role } from '../../utils/enums';
import { getLocalTimeZoneFromDevice } from '../../utils/localTimeDetailsForDevice';
import { ACLModules } from '../access-control-layer-module-service/decorator/aclModule.decorator';
import { DeviceService } from '../device/device.service';
import { DeviceDTO } from '../device/dto';
import { OrganizationService } from '../organization/organization.service';
import { Permission } from '../permission/decorators/permission.decorator';
import { NewIntermediateMeterReadDTO } from '../reads/dto/intermediate_meter_read.dto';
import { Roles } from '../user/decorators/roles.decorator';
import { UserDecorator } from '../user/decorators/user.decorator';
import { UserService } from '../user/user.service';
import { BASE_READ_SERVICE } from './constants';
import { FilterNoOffLimit } from './dto/filter-no-off-limit.dto';
import { ReadsService } from './reads.service';

@Controller('meter-reads')
@ApiBearerAuth('access-token')
@ApiTags('Meter Reads')
export class ReadsController extends BaseReadsController {
  private readonly logger = new Logger(ReadsController.name);

  constructor(
    private internalReadsService: ReadsService,
    private deviceService: DeviceService,
    @Inject(BASE_READ_SERVICE)
    baseReadsService: BaseReadsService,
    private readonly organizationService: OrganizationService,
    private readonly userService: UserService,
  ) {
    super(baseReadsService);
  }

  /**
   * This api user for get all the timezone list and also from serach key
   * @param searchKeyword :string
   * @returns {string[]}
   */
  @Get('/time-zones')
  @UseGuards(PermissionGuard)
  @Permission('Read')
  @ACLModules('READS_MANAGEMENT_CRUDL')
  @ApiOperation({
    summary: 'Get valid time zones',
    description:
      'Returns a list of valid time zones. Optionally filtered by a search keyword.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns valid time-zones list',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid search keyword provided.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden. User does not have the required permissions.',
  })
  getTimezones(
    @Query('timezoneSearchKeyword') searchKeyword?: string,
  ): string[] {
    this.logger.verbose(`With in getTimezones`);
    if (searchKeyword) {
      return momentTimeZone.tz
        .names()
        .filter((timezone) =>
          timezone.toLowerCase().includes(searchKeyword.toLowerCase()),
        );
    } else {
      return momentTimeZone.tz.names();
    }
  }

  /**
   * This api route use for to get all read of device
   * @param meterId :string
   * @param filter:{FilterDTO}
   * @returns {ReadDTO[]}
   */
  @Get('/:externalId')
  @ApiOperation({
    summary: 'Get time-series of meter reads',
    description:
      'Returns time-series data of meter reads for the specified device.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [ReadDTO],
    description: 'Returns time-series of meter reads.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Device not found for the given external ID.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden. User does not have the required permissions.',
  })
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Read')
  @ACLModules('READS_MANAGEMENT_CRUDL')
  public async getReads(
    @Param('externalId') meterId: string,
    @Query() filter: FilterDTO,
  ): Promise<ReadDTO[]> {
    this.logger.verbose(`With in getReads`);
    const device: DeviceDTO | null =
      await this.deviceService.findReads(meterId);

    if (device === null) {
      this.logger.error(`Invalid device id`);
      throw new ConflictException({
        success: false,
        message: `Invalid device id`,
      });
    }
    return super.getReads(device.externalId, filter);
  }

  /**
   * this api route use for all meter read by externalId
   * @param meterId :string
   * @param filter {FilterNoOffLimit}
   * @param pageNumber :number
   * @param month :number
   * @param year :number
   * @param user {ILoggedInUser}
   * @returns {ReadDTO}
   */
  @Get('new/:externalId')
  @ApiQuery({ name: 'Month', type: Number, required: false })
  @ApiQuery({ name: 'Year', type: Number, required: false })
  @ApiQuery({ name: 'pagenumber', type: Number, required: false })
  @ApiOperation({
    summary: 'Get time-series of meter reads with filters',
    description:
      'Returns time-series of meter reads for the specified device, with optional filters for month, year, and pagination.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [ReadDTO],
    description: 'Returns time-series of meter reads.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid parameters provided.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Device not found for the given external ID.',
  })
  @UseGuards(
    AuthVerifiedGuard(['jwt', 'oauth2-client-password']),
    PermissionGuard,
  )
  @Permission('Read')
  @ACLModules('READS_MANAGEMENT_CRUDL')
  public async newGetReads(
    @Param('externalId') meterId: string,
    @Query() filter: FilterNoOffLimit,
    @Query('pagenumber') pageNumber: number | null,
    @Query('Month') month: number | null,
    @Query('Year') year: number | null,
    @UserDecorator() user: ILoggedInUser,
  ): Promise<any> {
    this.logger.verbose(`With in newgetReads`);
    //finding the device details throught the device service
    let orgUser: IUser | null;
    if (filter.organizationId) {
      const organization = await this.organizationService.findOne(
        filter.organizationId,
      );
      orgUser = await this.userService.findByEmail(organization.orgEmail);
      if (
        user.role === Role.ApiUser &&
        user.api_user_id != organization.api_user_id
      ) {
        this.logger.error(
          `An apiuser cannot view the reads of other apiuser's`,
        );
        throw new BadRequestException({
          success: false,
          message: `An apiuser cannot view the reads of other apiuser's`,
        });
      }
      if (
        user.role === Role.OrganizationAdmin &&
        user.organizationId != filter.organizationId
      ) {
        this.logger.error(
          `An developer can't view the reads of other organization`,
        );
        throw new BadRequestException({
          success: false,
          message: `An developer can't view the reads of other organization`,
        });
      }

      if (
        user.role != Role.Admin &&
        user.api_user_id != organization.api_user_id
      ) {
        this.logger.error(
          `An developer cannot view the reads of other ApiUsers's`,
        );
        throw new BadRequestException({
          success: false,
          message: `An developer cannot view the reads of other ApiUsers's`,
        });
      }
      user.organizationId = filter.organizationId;
    }

    filter.offset = 0;
    filter.limit = 5;
    let device: DeviceDTO | null;
    if (month && !year) {
      this.logger.error(`Year is required when month is given`);
      throw new HttpException('Year is required when month is given', 400);
    }

    if (
      user.role === 'Buyer' ||
      user.role === 'Admin' ||
      (filter.organizationId != undefined && orgUser.role === 'Buyer') ||
      (user.role === 'ApiUser' && filter.organizationId == undefined)
    ) {
      if (isNaN(parseInt(meterId))) {
        this.logger.error(
          `The URL param externalId should be number.. please provide the device id of which you want to query`,
        );
        throw new BadRequestException({
          success: false,
          message: `The URL param externalId should be number.. please provide the device id of which you want to query`,
        });
      }
      device = await this.deviceService.findOne(parseInt(meterId));
      if (
        orgUser != undefined &&
        device.api_user_id === null &&
        orgUser.role === Role.Buyer
      ) {
        this.logger.error(
          `An buyer of apiuser can't view the reads of direct organization`,
        );
        throw new BadRequestException({
          success: false,
          message: `An buyer of apiuser can't view the reads of direct organization`,
        });
      }
      if (user.role === Role.Buyer) {
        if (device.api_user_id != null) {
          this.logger.error(
            `An buyer can't view the reads of apiuser's organization`,
          );
          throw new BadRequestException({
            success: false,
            message: `An buyer can't view the reads of apiuser's organization`,
          });
        }

        if (
          orgUser != undefined &&
          device.organizationId === orgUser.organization.id
        ) {
          this.logger.error(
            `The organizationId given not same as the device's organization`,
          );
          throw new BadRequestException({
            success: false,
            message: `The organizationId given not same as the device's organization `,
          });
        }
      }
    } else {
      device = await this.deviceService.findDeviceByExternalId(
        meterId,
        user.organizationId,
      );
    }

    if (device === null) {
      this.logger.error(`Invalid device id`);
      throw new ConflictException({
        success: false,
        message: `Invalid device id`,
      });
    }

    if (filter.readType === 'accumulated' && filter.accumulationType) {
      return this.internalReadsService.getAccumulatedReads(
        device.externalId,
        user.organizationId,
        device.developerExternalId,
        filter.accumulationType,
        month,
        year,
      );
    } else if (filter.readType === 'meterReads') {
      const timezone = getLocalTimeZoneFromDevice(filter.start, device);
      this.logger.log('the timezone we got from all reads is:::' + timezone);
      const returnedObject = await this.internalReadsService.getAllRead(
        device.externalId,
        filter,
        device.createdAt,
        pageNumber,
      );
      this.logger.log(
        'THE RETURNED OBJECT KEYS:::' + Object.keys(returnedObject),
      );
      Object.assign(returnedObject, { timezone: timezone });
      this.logger.log(
        'THE CHANGED OBJECT KEYS::::::' + Object.keys(returnedObject),
      );
      return returnedObject;
    } else {
      this.logger.error(`Invalid readType parameter`);
      throw new HttpException('Invalid readType parameter', 400);
    }
  }

  /* */

  /**
   * This api route use for add meter read of devices
   * @param id
   * @param measurements
   * @param user
   * @returns {NewIntermediateMeterReadDTO}
   */
  @Post('new/:id')
  @ApiOperation({
    summary: 'Add new meter read',
    description:
      'Stores new meter reads for historical data, delta readings, and aggregate readings.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'New meter reads successfully stored.',
    type: [NewIntermediateMeterReadDTO],
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid data provided for meter read.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden. User does not have the required permissions.',
  })
  @UseGuards(
    AuthVerifiedGuard(['jwt', 'oauth2-client-password']),
    RolesGuard,
    PermissionGuard,
  )
  @Roles(Role.Admin, Role.DeviceOwner, Role.OrganizationAdmin, Role.ApiUser)
  @Permission('Write')
  @ACLModules('READS_MANAGEMENT_CRUDL')
  public async newStoreRead(
    @Param('id') id: string,
    @Body() measurements: NewIntermediateMeterReadDTO,
    @UserDecorator() user: ILoggedInUser,
  ): Promise<void> {
    this.logger.verbose(`With in newStoreRead`);
    if (measurements.organizationId) {
      await this.organizationService.checkIfCanManage({
        user,
        organizationId: measurements.organizationId,
      });
      user.organizationId = measurements.organizationId;
    }
    return this.internalReadsService.validateAndStoreReads({
      deviceExternalId: id.trim(),
      measurements,
      organizationId: user.organizationId,
    });
  }

  /**
   *  new api for read add by superadmin
   * id param is deivce externalid
   * @param id :string
   * @param organizationId
   * @param measurements
   * @param user
   * @returns {NewIntermediateMeterReadDTO}
   */

  @Post('addByAdmin/new/:id')
  @ApiOperation({
    summary: 'Add new meter read by admin',
    description:
      'Stores new meter reads for historical data, delta readings, and aggregate readings by an admin user.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'New meter reads successfully stored.',
    type: [NewIntermediateMeterReadDTO],
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid data provided for meter read.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden. User does not have the required permissions.',
  })
  @ApiQuery({
    name: 'organizationId',
    required: false,
    type: Number,
    description: 'This query parameter is used to for admin...',
  })
  @UseGuards(AuthVerifiedGuard('jwt'), RolesGuard, PermissionGuard)
  @Roles(Role.Admin, Role.DeviceOwner, Role.OrganizationAdmin)
  @Permission('Write')
  @ACLModules('READS_MANAGEMENT_CRUDL')
  public async newStoreReadAddByAdmin(
    @Param('id') id: string,
    @Query('organizationId') organizationId: number | null,
    @Body() measurements: NewIntermediateMeterReadDTO,
    @UserDecorator() user: ILoggedInUser,
  ): Promise<void> {
    this.logger.verbose(`With in newStoreReadaddbyadmin`);
    if (
      organizationId === null ||
      organizationId === undefined ||
      isNaN(organizationId)
    ) {
      organizationId = user.organizationId;
    }
    return this.internalReadsService.validateAndStoreReads({
      deviceExternalId: id.trim(),
      measurements,
      organizationId,
    });
  }

  /**
   * this api create for last read of device by external id
   * @returns {enddate:DateTime,value:number}
   */
  @Get('/latestread/:externalId')
  @ApiOperation({
    summary: 'Get latest meter read',
    description:
      'Returns the latest meter read of the given device by its external ID. This is useful for quickly accessing the most recent read data without retrieving the entire history.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the latest meter read of the given device.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description:
      'Device not found for the given external ID. Verify the ID and try again.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden. User does not have the required permissions.',
  })
  @UseGuards(
    AuthVerifiedGuard(['jwt', 'oauth2-client-password']),
    PermissionGuard,
  )
  @Permission('Read')
  @ACLModules('READS_MANAGEMENT_CRUDL')
  public async getLatestMeterRead(
    @Param('externalId') externalId: string,
    @UserDecorator() user: ILoggedInUser,
  ): Promise<any> {
    this.logger.verbose(`With in getLatestMeterRead`);
    let device: DeviceDTO | null;
    if (
      user.role === 'Buyer' ||
      user.role === 'Admin' ||
      user.role === 'ApiUser'
    ) {
      // in buyer case externalid means insert id
      device = await this.deviceService.findOne(parseInt(externalId));
    } else {
      device = await this.deviceService.findDeviceByExternalId(
        externalId,
        user.organizationId,
      );
    }

    if (device === null) {
      throw new ConflictException({
        success: false,
        message: `Invalid device id`,
      });
    }

    let latestReadObject;

    const deviceExternalId = device.externalId;

    if (!device.meterReadtype) {
      this.logger.error(`Read not found`);
      throw new HttpException('Read not found', 400);
    } else {
      latestReadObject = await this.internalReadsService.latestRead(
        deviceExternalId,
        device.createdAt,
      );

      if (
        typeof latestReadObject === 'undefined' ||
        latestReadObject.length == 0
      ) {
        this.logger.error(`Read Not found`);
        throw new HttpException('Read Not found', 400);
      }
      if (user.role === 'Buyer' || user.role === 'ApiUser') {
        return {
          externalId: device.developerExternalId,
          timestamp: latestReadObject[0].timestamp,
          value: latestReadObject[0].value,
        };
      }

      return {
        enddate: latestReadObject[0].timestamp,
        value: latestReadObject[0].value,
      };
    }
  }
}

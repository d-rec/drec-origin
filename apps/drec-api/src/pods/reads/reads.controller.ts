import {
  BaseReadsController,
  FilterDTO,
  ReadDTO,
  ReadsService as BaseReadsService,
} from '@energyweb/energy-api-influxdb';
import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
  ConflictException,
  HttpException,
  BadRequestException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { BASE_READ_SERVICE } from './const';
import { MeterReadsService } from './reads.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../user/decorators/roles.decorator';
import { RolesGuard } from '../../guards/RolesGuard';
import { Role } from '../../utils/enums';
import { NewIntmediateMeterReadDTO } from '../reads/dto/intermediate_meter_read.dto';
import { DeviceService } from '../device';
import { UserDecorator } from '../user/decorators/user.decorator';
import { ILoggedInUser, IUser } from '../../models';
import { DeviceDTO } from '../device/dto';
import { ReadType } from '../../utils/enums';
import { isValidUTCDateFormat } from '../../utils/checkForISOStringFormat';
import * as momentTimeZone from 'moment-timezone';
import { filterNoOffLimit } from './dto/filter-no-off-limit.dto';
import { getLocalTimeZoneFromDevice } from '../../utils/localTimeDetailsForDevice';
import { PermissionGuard } from '../../guards';
import { Permission } from '../permission/decorators/permission.decorator';
import { ACLModules } from '../access-control-layer-module-service/decorator/aclModule.decorator';
import { OrganizationService } from '../organization/organization.service';
import { UserService } from '../user/user.service';

@Controller('meter-reads')
@ApiBearerAuth('access-token')
@ApiTags('meter-reads')
export class ReadsController extends BaseReadsController {
  private readonly logger = new Logger(ReadsController.name);

  constructor(
    private internalReadsService: MeterReadsService,
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
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns valid time-zones list',
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
   * This api route use for to get all read of devcie
   * @param meterId :string
   * @param filter:{FilterDTO}
   * @returns {ReadDTO[]}
   */
  @Get('/:externalId')
  @ApiResponse({
    status: HttpStatus.OK,
    type: [ReadDTO],
    description: 'Returns  time-series of meter reads',
  })
  @UseGuards(AuthGuard('jwt'), PermissionGuard)
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
      return new Promise((resolve, reject) => {
        reject(
          new ConflictException({
            success: false,
            message: `Invalid device id`,
          }),
        );
      });
    }
    return super.getReads(device.externalId, filter);
  }

  /**
   * this api route use for all meter read by externalId
   * @param meterId :string
   * @param filter {filterNoOffLimit}
   * @param pagenumber :number
   * @param month :number
   * @param year :number
   * @param user {ILoggedInUser}
   * @returns {ReadDTO}
   */
  @Get('new/:externalId')
  @ApiQuery({ name: 'Month', type: Number, required: false })
  @ApiQuery({ name: 'Year', type: Number, required: false })
  @ApiQuery({ name: 'pagenumber', type: Number, required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [ReadDTO],
    description: 'Returns time-series of meter reads',
  })
  @UseGuards(AuthGuard(['jwt', 'oauth2-client-password']), PermissionGuard)
  @Permission('Read')
  @ACLModules('READS_MANAGEMENT_CRUDL')
  public async newgetReads(
    @Param('externalId') meterId: string,
    @Query() filter: filterNoOffLimit,
    @Query('pagenumber') pagenumber: number | null,
    @Query('Month') month: number | null,
    @Query('Year') year: number | null,
    @UserDecorator() user: ILoggedInUser,
  ) /*: Promise<ReadDTO[]>*/ {
    this.logger.verbose(`With in newgetReads`);
    //finding the device details throught the device service
    let orguser: IUser | null;
    if (filter.organizationId) {
      const organization = await this.organizationService.findOne(
        filter.organizationId,
      );
      orguser = await this.userService.findByEmail(organization.orgEmail);
      if (user.role === Role.ApiUser) {
        if (user.api_user_id != organization.api_user_id) {
          this.logger.error(
            `An apiuser cannot view the reads of other apiuser's`,
          );
          throw new BadRequestException({
            success: false,
            message: `An apiuser cannot view the reads of other apiuser's`,
          });
        } else {
          user.organizationId = filter.organizationId;
        }
      } else {
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
      (filter.organizationId != undefined && orguser.role === 'Buyer') ||
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
      // @ts-ignore
      if (
        orguser != undefined &&
        // @ts-ignore ts(2339)
        device.api_user_id === null &&
        // @ts-ignore ts(2304)
        orguser.role === enums_1.Role.Buyer
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
        // @ts-ignore
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
          orguser != undefined &&
          device.organizationId === orguser.organization.id
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
      device = await this.deviceService.findDeviceByDeveloperExternalId(
        meterId,
        user.organizationId,
      );
    }

    if (device === null) {
      this.logger.error(`Invalid device id`);
      return new Promise((resolve, reject) => {
        reject(
          new ConflictException({
            success: false,
            message: `Invalid device id`,
          }),
        );
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
        pagenumber,
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
   * @returns {NewIntmediateMeterReadDTO}
   */
  @Post('new/:id')
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'New meter reads for historical data, Delta readings and Aggregate Readings',
    type: [NewIntmediateMeterReadDTO],
  })
  @UseGuards(
    AuthGuard(['jwt', 'oauth2-client-password']),
    RolesGuard,
    PermissionGuard,
  )
  @Roles(Role.Admin, Role.DeviceOwner, Role.OrganizationAdmin, Role.ApiUser)
  @Permission('Write')
  @ACLModules('READS_MANAGEMENT_CRUDL')
  public async newstoreRead(
    @Param('id') id: string,
    @Body() measurements: NewIntmediateMeterReadDTO,
    @UserDecorator() user: ILoggedInUser,
  ): Promise<void> {
    this.logger.verbose(`With in newstoreRead`);
    if (measurements.organizationId) {
      const senderorg = await this.organizationService.findOne(
        measurements.organizationId,
      );
      const orguser = await this.userService.findByEmail(senderorg.orgEmail);
      if (
        user.organizationId !== measurements.organizationId &&
        user.role !== Role.ApiUser
      ) {
        this.logger.error(
          `Organization in measurement is not same as user's organization`,
        );
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message: `Organization in measurement is not same as user's organization`,
            }),
          );
        });
      }

      if (user.role === Role.ApiUser) {
        if (senderorg.api_user_id !== user.api_user_id) {
          this.logger.error(
            `Organization ${senderorg.name} in measurement is not part of your organization`,
          );
          return new Promise((resolve, reject) => {
            reject(
              new ConflictException({
                success: false,
                message: `Organization ${senderorg.name} in measurement is not part of your organization`,
              }),
            );
          });
        } else if (orguser.role != Role.OrganizationAdmin) {
          this.logger.error(`Unauthorized`);
          return new Promise((resolve, reject) => {
            reject(
              new UnauthorizedException({
                success: false,
                message: `Unauthorized`,
              }),
            );
          });
        } else {
          // @ts-ignore
          user.organizationId = measurements.organizationId;
        }
      }
    }

    if (id.trim() === '' && id.trim() === undefined) {
      this.logger.error(`id should not be empty`);
      return new Promise((resolve, reject) => {
        reject(
          new ConflictException({
            success: false,
            message: `id should not be empty`,
          }),
        );
      });
    }
    id = id.trim();
    const device: DeviceDTO | null =
      await this.deviceService.findDeviceByDeveloperExternalId(
        id,
        user.organizationId,
      );
    if (device === null) {
      this.logger.error(`Invalid device id`);
      return new Promise((resolve, reject) => {
        reject(
          new ConflictException({
            success: false,
            message: `Invalid device id`,
          }),
        );
      });
    }

    if (
      measurements.timezone !== null &&
      measurements.timezone !== undefined &&
      measurements.timezone.toString().trim() !== ''
    ) {
      measurements.timezone = measurements.timezone.toString().trim();
      const allTimezoneNamesLowerCase: Array<string> = [];
      momentTimeZone.tz
        .names()
        .forEach((ele) => allTimezoneNamesLowerCase.push(ele.toLowerCase()));
      if (
        !allTimezoneNamesLowerCase.includes(measurements.timezone.toLowerCase())
      ) {
        this.logger.error(`Invalid time zone: ${measurements.timezone}`);
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message: `Invalid time zone: ${measurements.timezone}`,
            }),
          );
        });
      }
      measurements.timezone =
        momentTimeZone.tz.names()[
          allTimezoneNamesLowerCase.findIndex(
            (ele) => ele === measurements.timezone.toLowerCase(),
          )
        ];
      let dateInvalid = false;
      measurements.reads.forEach((ele) => {
        for (const key in ele) {
          if (key === 'starttimestamp' || key === 'endtimestamp') {
            if (ele[key]) {
              const dateTimeRegex =
                /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.{0,1}\d{0,3}$/;
              // @ts-ignore ts(2339)
              if (ele[key].includes('.')) {
                if (
                  Number.isNaN(
                    parseFloat(
                      // @ts-ignore ts(2339)
                      ele[key].substring(
                        // @ts-ignore ts(2339)
                        ele[key].indexOf('.'),
                        // @ts-ignore ts(2339)
                        ele[key].length,
                      ),
                    ),
                  )
                ) {
                  this.logger.error(
                    `Invalid date sent  ${ele[key]}` +
                      ` please sent valid date, format for dates is YYYY-MM-DD hh:mm:ss example 2020-02-19 19:20:55 or to include milliseconds add dot and upto 3 digits after seconds example 2020-02-19 19:20:55.2 or 2020-02-19 19:20:54.333`,
                  );
                  throw new ConflictException({
                    success: false,
                    message:
                      `Invalid date sent  ${ele[key]}` +
                      ` please sent valid date, format for dates is YYYY-MM-DD hh:mm:ss example 2020-02-19 19:20:55 or to include milliseconds add dot and upto 3 digits after seconds example 2020-02-19 19:20:55.2 or 2020-02-19 19:20:54.333`,
                  });
                }
              }

              // @ts-ignore
              if (!dateTimeRegex.test(ele[key])) {
                dateInvalid = true;
                this.logger.error(
                  `Invalid date sent  ${ele[key]}` +
                    ` please sent valid date, format for dates is YYYY-MM-DD hh:mm:ss example 2020-02-19 19:20:55 or to include milliseconds add dot and upto 3 digits after seconds example 2020-02-19 19:20:55.2 or 2020-02-19 19:20:54.333`,
                );
                throw new ConflictException({
                  success: false,
                  message:
                    `Invalid date sent  ${ele[key]}` +
                    ` please sent valid date, format for dates is YYYY-MM-DD hh:mm:ss example 2020-02-19 19:20:55 or to include milliseconds add dot and upto 3 digits after seconds example 2020-02-19 19:20:55.2 or 2020-02-19 19:20:54.333`,
                });
              } else {
                let dateTime;
                dateTime = momentTimeZone.tz(ele[key], measurements.timezone);
                if (!dateTime.isValid()) {
                  dateInvalid = true;
                  this.logger.error(`Invalid date sent  ${ele[key]}`);
                  throw new ConflictException({
                    success: false,
                    message: `Invalid date sent  ${ele[key]}`,
                  });
                } else {
                  let milliSeondsToAddSentInRequest = '';
                  if (
                    // @ts-ignore ts(2339)
                    ele[key].includes('.') &&
                    parseInt(
                      // @ts-ignore ts(2339)
                      ele[key].substring(
                        // @ts-ignore ts(2339)
                        ele[key].indexOf('.'),
                        // @ts-ignore ts(2339)
                        ele[key].length,
                      ),
                    ) != NaN
                  ) {
                    // @ts-ignore
                    milliSeondsToAddSentInRequest = ele[key].substring(
                      // @ts-ignore ts(2339)
                      ele[key].indexOf('.'),
                      // @ts-ignore ts(2339)
                      ele[key].length,
                    );
                  }
                  let utcString: string = dateTime.clone().utc().format();

                  if (milliSeondsToAddSentInRequest != '') {
                    utcString =
                      utcString.substring(0, utcString.length - 1) +
                      milliSeondsToAddSentInRequest +
                      'Z';
                  } else {
                    utcString =
                      utcString.substring(0, utcString.length - 1) + '.000Z';
                  }
                  // @ts-ignore
                  ele[key] = utcString;
                }
              }
            }
          }
        }
      });
      if (dateInvalid) {
        this.logger.error(
          `Invalid date please sent valid date, format for dates is YYYY-MM-DD hh:mm:ss example 2020-02-19 19:20:55 or to include milliseconds add dot and upto 3 digits after seconds example 2020-02-19 19:20:55.2 or 2020-02-19 19:20:54.333`,
        );
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message: `Invalid date please sent valid date, format for dates is YYYY-MM-DD hh:mm:ss example 2020-02-19 19:20:55 or to include milliseconds add dot and upto 3 digits after seconds example 2020-02-19 19:20:55.2 or 2020-02-19 19:20:54.333`,
            }),
          );
        });
      }
      device.createdAt = momentTimeZone
        .tz(device.createdAt, measurements.timezone)
        .toDate();
      device.commissioningDate = momentTimeZone
        .tz(new Date(device?.commissioningDate), measurements.timezone)
        .format();
    }

    //check for according to read type if start time stamp and end time stamps are sent
    if (measurements.type === ReadType.History) {
      let datesContainingNullOrEmptyValues = false;
      let datevalid = true;
      let allDatesAreBeforeCreatedAt = true;
      let allStartDatesAreBeforeEnddate = true;
      let readvalue = true;
      let historyallStartDatesAreAftercommissioningDate = true;
      let historyallEndDatesAreAftercommissioningDate = true;
      measurements.reads.forEach((ele) => {
        // @ts-ignore
        if (
          ele.starttimestamp === null ||
          ele.starttimestamp === undefined ||
          // @ts-ignore ts(2367)
          ele.starttimestamp === '' ||
          ele.endtimestamp === null ||
          ele.endtimestamp === undefined ||
          // @ts-ignore ts(2367)
          ele.endtimestamp === ''
        ) {
          datesContainingNullOrEmptyValues = true;
        }
        // @ts-ignore
        const startdateformate = isValidUTCDateFormat(ele.starttimestamp);
        //dateFormateToCheck.test(ele.starttimestamp);
        // @ts-ignore
        const enddateformate = isValidUTCDateFormat(ele.endtimestamp);

        if (!startdateformate || !enddateformate) {
          datevalid = false;
        }
        if (device && device.createdAt) {
          if (
            new Date(ele.endtimestamp).getTime() >
            new Date(device.createdAt).getTime()
          ) {
            allDatesAreBeforeCreatedAt = false;
          }
          if (
            new Date(ele.starttimestamp).getTime() >
            new Date(device.createdAt).getTime()
          ) {
            allDatesAreBeforeCreatedAt = false;
          }
          if (
            new Date(ele.starttimestamp).getTime() >
            new Date(ele.endtimestamp).getTime()
          ) {
            allStartDatesAreBeforeEnddate = false;
          }
        }

        if (ele.value < 0) {
          readvalue = false;
        }
        if (device && device.commissioningDate) {
          //const cur = new Date().toLocaleString('en-US', { timeZone: measurements.timezone })

          if (
            new Date(ele.starttimestamp).getTime() <=
            new Date(device.commissioningDate).getTime()
          ) {
            historyallStartDatesAreAftercommissioningDate = false;
          }
          if (
            new Date(ele.endtimestamp).getTime() <=
            new Date(device.commissioningDate).getTime()
          ) {
            historyallEndDatesAreAftercommissioningDate = false;
          }
        }
      });

      if (datesContainingNullOrEmptyValues) {
        this.logger.error(
          `One ore more Start Date and End Date values are not sent for History, start and end date is required for History meter ready type`,
        );
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message:
                'One ore more Start Date and End Date values are not sent for History, start and end date is required for History meter ready type',
            }),
          );
        });
      }
      if (!datevalid) {
        this.logger.error(
          `Invalid Start Date and/or End Date, valid format is  YYYY-MM-DDThh:mm:ss.millisecondsZ example 2022-10-18T11:35:27.640Z`,
        );
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message:
                ' Invalid Start Date and/or End Date, valid format is  YYYY-MM-DDThh:mm:ss.millisecondsZ example 2022-10-18T11:35:27.640Z ',
            }),
          );
        });
      }
      if (!allStartDatesAreBeforeEnddate) {
        this.logger.error(
          `starttimestamp should be prior to endtimestamp. One or more measurements starttimestamp is greater than endtimestamp`,
        );
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message: `starttimestamp should be prior to endtimestamp. One or more measurements starttimestamp is greater than endtimestamp `,
            }),
          );
        });
      }
      if (!allDatesAreBeforeCreatedAt) {
        this.logger.error(
          `For History reading start timestamp and end timestamp should be prior to device onboarding date. One or more measurements endtimestamp and or start timestamp is greater than device OnBoarding Date ${device?.createdAt}`,
        );
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message: `For History reading start timestamp and end timestamp should be prior to device onboarding date. One or more measurements endtimestamp and or start timestamp is greater than device OnBoarding Date ${device?.createdAt}`,
            }),
          );
        });
      }

      if (!readvalue) {
        this.logger.error(`meter read value should be greater then 0`);
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message: `meter read value should be greater then 0 `,
            }),
          );
        });
      }
      if (!historyallStartDatesAreAftercommissioningDate) {
        this.logger.error(
          `One or more measurements starttimestamp should be greater than to device Commissioning Date ${device?.commissioningDate}`,
        );
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message: `One or more measurements starttimestamp should be greater than to device Commissioning Date ${device?.commissioningDate}`,
            }),
          );
        });
      }
      if (!historyallEndDatesAreAftercommissioningDate) {
        this.logger.error(
          `One or more measurements endtimestamp should be greater than to device commissioningDate date ${device?.commissioningDate}`,
        );
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message: `One or more measurements endtimestamp should be greater than to device commissioningDate date ${device?.commissioningDate}`,
            }),
          );
        });
      }
    }
    if (
      measurements.type === ReadType.Delta ||
      measurements.type === ReadType.ReadMeter
    ) {
      this.logger.log('Line No: 505');
      let datesContainingNullOrEmptyValues = false;
      let datevalid1 = true;
      let allDatesAreAfterCreatedAt = true;
      let allDatesAreAftercommissioningDate = true;
      let allEndDatesAreBeforSystemDate = true;
      let enddate: any;
      let currentdate: Date = new Date();
      measurements.reads.forEach((ele) => {
        this.logger.log('Line No: 512');
        if (
          ele.endtimestamp === null ||
          ele.endtimestamp === undefined ||
          // @ts-ignore ts(2339)
          ele.endtimestamp === ''
        ) {
          datesContainingNullOrEmptyValues = true;
        }
        // @ts-ignore
        const enddateformate = isValidUTCDateFormat(ele.endtimestamp);

        if (!enddateformate) {
          datevalid1 = false;
        }
        //check validation with onboarding date
        if (device && device.createdAt) {
          if (
            new Date(ele.endtimestamp).getTime() <=
            new Date(device.createdAt).getTime()
          ) {
            allDatesAreAfterCreatedAt = false;
            enddate = ele.endtimestamp;
          }
        }
        //check validation with commissioning Date
        if (device && device.commissioningDate) {
          if (
            new Date(ele.endtimestamp).getTime() <=
            new Date(device.commissioningDate).getTime()
          ) {
            allDatesAreAftercommissioningDate = false;
            enddate = ele.endtimestamp;
          }
        }

        //check validation with System Date
        if (new Date(ele.endtimestamp).getTime() > new Date().getTime()) {
          allEndDatesAreBeforSystemDate = false;
          enddate = ele.endtimestamp;
        }
      });
      if (datesContainingNullOrEmptyValues) {
        this.logger.error(
          `One ore more End Date values are not sent for ${measurements.type},  end date is required`,
        );
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message: `One ore more End Date values are not sent for ${measurements.type},  end date is required`,
            }),
          );
        });
      }
      if (!datevalid1) {
        this.logger.error(
          `Invalid  End Date, valid format is  YYYY-MM-DDThh:mm:ss.millisecondsZ example 2022-10-18T11:35:27.640Z`,
        );
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message:
                ' Invalid  End Date, valid format is  YYYY-MM-DDThh:mm:ss.millisecondsZ example 2022-10-18T11:35:27.640Z ',
            }),
          );
        });
      }
      if (
        measurements.timezone !== null &&
        measurements.timezone !== undefined &&
        measurements.timezone.toString().trim() !== ''
      ) {
        enddate = momentTimeZone.tz(enddate, measurements.timezone);
        currentdate = momentTimeZone
          .tz(currentdate, measurements.timezone)
          .toDate();
      }
      if (!allDatesAreAfterCreatedAt) {
        this.logger.error(
          `One or more measurements endtimestamp ${enddate} is less than or equal to device onboarding date ${device?.createdAt}`,
        );
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message: `One or more measurements endtimestamp ${enddate} is less than or equal to device onboarding date ${device?.createdAt}`,
            }),
          );
        });
      }
      if (!allDatesAreAftercommissioningDate) {
        this.logger.error(
          `One or more measurements endtimestamp ${enddate} should be greater than to device commissioningDate date${device?.commissioningDate}`,
        );
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message: `One or more measurements endtimestamp ${enddate} should be greater than to device commissioningDate date${device?.commissioningDate}`,
            }),
          );
        });
      }
      if (!allEndDatesAreBeforSystemDate) {
        this.logger.error(
          `One or more measurements endtimestamp ${enddate} is greater than current date ${currentdate}`,
        );
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message: `One or more measurements endtimestamp ${enddate} is greater than current date ${currentdate}`,
            }),
          );
        });
      }
    }

    // negative value validation
    if (
      measurements.type === ReadType.History ||
      measurements.type === ReadType.Delta
    ) {
      let readvalue = true;
      measurements.reads.forEach((ele) => {
        if (ele.value <= 0) {
          readvalue = false;
        }
      });
      if (!readvalue) {
        this.logger.error(`meter read value should be greater then 0`);
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message: `meter read value should be greater then 0 `,
            }),
          );
        });
      }
    }
    // device organization and user organization validation
    if (device && device.organizationId !== user.organizationId) {
      this.logger.error(
        `Device doesnt belongs to the requested users organization`,
      );
      return new Promise((resolve, reject) => {
        reject(
          new ConflictException({
            success: false,
            message: `Device doesnt belongs to the requested users organization`,
          }),
        );
      });
    }

    if (measurements.reads.length > 1) {
      this.logger.error(`can not allow multiple reads simultaneously`);
      return new Promise((resolve, reject) => {
        reject(
          new ConflictException({
            success: false,
            message: `can not allow multiple reads simultaneously `,
          }),
        );
      });
    }
    return await this.internalReadsService.newstoreRead(
      device.externalId,
      measurements,
    );
  }

  /**
   *  new api for read add by superadmin
   * id param is deivce externalid
   * @param id :string
   * @param organizationId
   * @param measurements
   * @param user
   * @returns {NewIntmediateMeterReadDTO}
   */

  @Post('addByAdmin/new/:id')
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'New meter reads for historical data, Delta readings and Aggregate Readings',
    type: [NewIntmediateMeterReadDTO],
  })
  @ApiQuery({
    name: 'organizationId',
    required: false,
    type: Number,
    description: 'This query parameter is used to for admin...',
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard, PermissionGuard)
  @Roles(Role.Admin, Role.DeviceOwner, Role.OrganizationAdmin)
  @Permission('Write')
  @ACLModules('READS_MANAGEMENT_CRUDL')
  public async newstoreReadaddbyadmin(
    @Param('id') id: string,
    @Query('organizationId') organizationId: number | null,
    @Body() measurements: NewIntmediateMeterReadDTO,
    @UserDecorator() user: ILoggedInUser,
  ): Promise<void> {
    this.logger.verbose(`With in newstoreReadaddbyadmin`);
    if (id.trim() === '' && id.trim() === undefined) {
      this.logger.error(`id should not be empty`);
      return new Promise((resolve, reject) => {
        reject(
          new ConflictException({
            success: false,
            message: `id should not be empty`,
          }),
        );
      });
    }
    id = id.trim();
    if (
      organizationId === null ||
      organizationId === undefined ||
      isNaN(organizationId)
    ) {
      organizationId = user.organizationId;
    }
    const device: DeviceDTO | null =
      await this.deviceService.findDeviceByDeveloperExternalId(
        id,
        organizationId,
      );
    if (device === null) {
      this.logger.error(`Invalid device id`);
      return new Promise((resolve, reject) => {
        reject(
          new ConflictException({
            success: false,
            message: `Invalid device id`,
          }),
        );
      });
    }

    if (
      measurements.timezone !== null &&
      measurements.timezone !== undefined &&
      measurements.timezone.toString().trim() !== ''
    ) {
      measurements.timezone = measurements.timezone.toString().trim();
      const allTimezoneNamesLowerCase: Array<string> = [];
      momentTimeZone.tz
        .names()
        .forEach((ele) => allTimezoneNamesLowerCase.push(ele.toLowerCase()));

      if (
        !allTimezoneNamesLowerCase.includes(measurements.timezone.toLowerCase())
      ) {
        this.logger.error(`Invalid time zone: ${measurements.timezone}`);
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message: `Invalid time zone: ${measurements.timezone}`,
            }),
          );
        });
      }
      measurements.timezone =
        momentTimeZone.tz.names()[
          allTimezoneNamesLowerCase.findIndex(
            (ele) => ele === measurements.timezone.toLowerCase(),
          )
        ];
      let dateInvalid = false;
      measurements.reads.forEach((ele) => {
        for (const key in ele) {
          if (key === 'starttimestamp' || key === 'endtimestamp') {
            if (ele[key]) {
              const dateTimeRegex =
                /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.{0,1}\d{0,3}$/;
              // @ts-ignore ts(2339)
              if (ele[key].includes('.')) {
                if (
                  Number.isNaN(
                    parseFloat(
                      // @ts-ignore ts(2339)
                      ele[key].substring(
                        // @ts-ignore ts(2339)
                        ele[key].indexOf('.'),
                        // @ts-ignore ts(2339)
                        ele[key].length,
                      ),
                    ),
                  )
                ) {
                  this.logger.error(
                    `Invalid date sent  ${ele[key]}` +
                      ` please sent valid date, format for dates is YYYY-MM-DD hh:mm:ss example 2020-02-19 19:20:55 or to include milliseconds add dot and upto 3 digits after seconds example 2020-02-19 19:20:55.2 or 2020-02-19 19:20:54.333`,
                  );
                  throw new ConflictException({
                    success: false,
                    message:
                      `Invalid date sent  ${ele[key]}` +
                      ` please sent valid date, format for dates is YYYY-MM-DD hh:mm:ss example 2020-02-19 19:20:55 or to include milliseconds add dot and upto 3 digits after seconds example 2020-02-19 19:20:55.2 or 2020-02-19 19:20:54.333`,
                  });
                }
              }

              // @ts-ignore
              if (!dateTimeRegex.test(ele[key])) {
                dateInvalid = true;
                this.logger.error(
                  `Invalid date sent  ${ele[key]}` +
                    ` please sent valid date, format for dates is YYYY-MM-DD hh:mm:ss example 2020-02-19 19:20:55 or to include milliseconds add dot and upto 3 digits after seconds example 2020-02-19 19:20:55.2 or 2020-02-19 19:20:54.333`,
                );
                throw new ConflictException({
                  success: false,
                  message:
                    `Invalid date sent  ${ele[key]}` +
                    ` please sent valid date, format for dates is YYYY-MM-DD hh:mm:ss example 2020-02-19 19:20:55 or to include milliseconds add dot and upto 3 digits after seconds example 2020-02-19 19:20:55.2 or 2020-02-19 19:20:54.333`,
                });
              } else {
                let dateTime;
                dateTime = momentTimeZone.tz(ele[key], measurements.timezone);
                if (!dateTime.isValid()) {
                  this.logger.error(`Invalid date sent  ${ele[key]}`);
                  dateInvalid = true;
                  throw new ConflictException({
                    success: false,
                    message: `Invalid date sent  ${ele[key]}`,
                  });
                } else {
                  let milliSeondsToAddSentInRequest = '';
                  if (
                    // @ts-ignore ts(2339)
                    ele[key].includes('.') &&
                    parseInt(
                      // @ts-ignore ts(2339)
                      ele[key].substring(
                        // @ts-ignore ts(2339)
                        ele[key].indexOf('.'),
                        // @ts-ignore ts(2339)
                        ele[key].length,
                      ),
                    ) != NaN
                  ) {
                    // @ts-ignore
                    milliSeondsToAddSentInRequest = ele[key].substring(
                      // @ts-ignore
                      ele[key].indexOf('.'),
                      // @ts-ignore
                      ele[key].length,
                    );
                  }
                  let utcString: string = dateTime.clone().utc().format();

                  if (milliSeondsToAddSentInRequest != '') {
                    utcString =
                      utcString.substring(0, utcString.length - 1) +
                      milliSeondsToAddSentInRequest +
                      'Z';
                  } else {
                    utcString =
                      utcString.substring(0, utcString.length - 1) + '.000Z';
                  }
                  // @ts-ignore
                  ele[key] = utcString;
                }
              }
            }
          }
        }
      });
      if (dateInvalid) {
        this.logger.error(
          `Invalid date please sent valid date, format for dates is YYYY-MM-DD hh:mm:ss example 2020-02-19 19:20:55 or to include milliseconds add dot and upto 3 digits after seconds example 2020-02-19 19:20:55.2 or 2020-02-19 19:20:54.333`,
        );
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message: `Invalid date please sent valid date, format for dates is YYYY-MM-DD hh:mm:ss example 2020-02-19 19:20:55 or to include milliseconds add dot and upto 3 digits after seconds example 2020-02-19 19:20:55.2 or 2020-02-19 19:20:54.333`,
            }),
          );
        });
      }
      device.createdAt = momentTimeZone
        .tz(device.createdAt, measurements.timezone)
        .toDate();
      device.commissioningDate = momentTimeZone
        .tz(new Date(device?.commissioningDate), measurements.timezone)
        .format();
    }

    //check for according to read type if start time stamp and end time stamps are sent
    if (measurements.type === ReadType.History) {
      let datesContainingNullOrEmptyValues = false;
      let datevalid = true;
      let allDatesAreBeforeCreatedAt = true;
      let allStartDatesAreBeforeEnddate = true;
      let readvalue = true;
      let historyallStartDatesAreAftercommissioningDate = true;
      let historyallEndDatesAreAftercommissioningDate = true;
      measurements.reads.forEach((ele) => {
        if (
          ele.starttimestamp === null ||
          ele.starttimestamp === undefined ||
          // @ts-ignore ts(2367)
          ele.starttimestamp === '' ||
          ele.endtimestamp === null ||
          ele.endtimestamp === undefined ||
          // @ts-ignore ts(2367)
          ele.endtimestamp === ''
        ) {
          datesContainingNullOrEmptyValues = true;
        }
        // @ts-ignore
        const startdateformate = isValidUTCDateFormat(ele.starttimestamp);

        // @ts-ignore
        const enddateformate = isValidUTCDateFormat(ele.endtimestamp);

        if (!startdateformate || !enddateformate) {
          datevalid = false;
        }
        if (device && device.createdAt) {
          if (
            new Date(ele.endtimestamp).getTime() >
            new Date(device.createdAt).getTime()
          ) {
            allDatesAreBeforeCreatedAt = false;
          }
          if (
            new Date(ele.starttimestamp).getTime() >
            new Date(device.createdAt).getTime()
          ) {
            allDatesAreBeforeCreatedAt = false;
          }
          if (
            new Date(ele.starttimestamp).getTime() >
            new Date(ele.endtimestamp).getTime()
          ) {
            allStartDatesAreBeforeEnddate = false;
          }
        }

        if (ele.value < 0) {
          readvalue = false;
        }
        if (device && device.commissioningDate) {
          if (
            new Date(ele.starttimestamp).getTime() <=
            new Date(device.commissioningDate).getTime()
          ) {
            historyallStartDatesAreAftercommissioningDate = false;
          }
          if (
            new Date(ele.endtimestamp).getTime() <=
            new Date(device.commissioningDate).getTime()
          ) {
            historyallEndDatesAreAftercommissioningDate = false;
          }
        }
      });

      if (datesContainingNullOrEmptyValues) {
        this.logger.error(
          `One ore more Start Date and End Date values are not sent for History, start and end date is required for History meter ready typ`,
        );
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message:
                'One ore more Start Date and End Date values are not sent for History, start and end date is required for History meter ready type',
            }),
          );
        });
      }
      if (!datevalid) {
        this.logger.error(
          `Invalid Start Date and/or End Date, valid format is  YYYY-MM-DDThh:mm:ss.millisecondsZ example 2022-10-18T11:35:27.640Z`,
        );
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message:
                ' Invalid Start Date and/or End Date, valid format is  YYYY-MM-DDThh:mm:ss.millisecondsZ example 2022-10-18T11:35:27.640Z ',
            }),
          );
        });
      }
      if (!allStartDatesAreBeforeEnddate) {
        this.logger.error(
          `starttimestamp should be prior to endtimestamp. One or more measurements starttimestamp is greater than endtimestamp`,
        );
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message: `starttimestamp should be prior to endtimestamp. One or more measurements starttimestamp is greater than endtimestamp `,
            }),
          );
        });
      }
      if (!allDatesAreBeforeCreatedAt) {
        this.logger.error(
          `For History reading start timestamp and end timestamp should be prior to device onboarding date. One or more measurements endtimestamp and or start timestamp is greater than device OnBoarding Date ${device?.createdAt}`,
        );
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message: `For History reading start timestamp and end timestamp should be prior to device onboarding date. One or more measurements endtimestamp and or start timestamp is greater than device OnBoarding Date ${device?.createdAt}`,
            }),
          );
        });
      }

      if (!readvalue) {
        this.logger.error(`meter read value should be greater then 0`);
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message: `meter read value should be greater then 0 `,
            }),
          );
        });
      }
      if (!historyallStartDatesAreAftercommissioningDate) {
        this.logger.error(
          `One or more measurements starttimestamp should be greater than to device Commissioning Date ${device?.commissioningDate}`,
        );
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message: `One or more measurements starttimestamp should be greater than to device Commissioning Date ${device?.commissioningDate}`,
            }),
          );
        });
      }
      if (!historyallEndDatesAreAftercommissioningDate) {
        this.logger.error(
          `One or more measurements endtimestamp should be greater than to device Commissioning Date ${device?.commissioningDate}`,
        );
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message: `One or more measurements endtimestamp should be greater than to device commissioningDate date ${device?.commissioningDate}`,
            }),
          );
        });
      }
    }
    if (
      measurements.type === ReadType.Delta ||
      measurements.type === ReadType.ReadMeter
    ) {
      this.logger.log('Line No: 505');
      let datesContainingNullOrEmptyValues = false;
      let datevalid1 = true;
      let allDatesAreAfterCreatedAt = true;
      let allDatesAreAftercommissioningDate = true;
      let allEndDatesAreBeforSystemDate = true;
      let enddate: any;
      let currentdate: Date = new Date();
      measurements.reads.forEach((ele) => {
        this.logger.log('Line No: 512');
        if (
          ele.endtimestamp === null ||
          ele.endtimestamp === undefined ||
          // @ts-ignore ts(2367)
          ele.endtimestamp === ''
        ) {
          datesContainingNullOrEmptyValues = true;
        }
        // @ts-ignore
        const enddateformate = isValidUTCDateFormat(ele.endtimestamp);

        if (!enddateformate) {
          datevalid1 = false;
        }
        //check validation with onboarding date
        if (device && device.createdAt) {
          if (
            new Date(ele.endtimestamp).getTime() <=
            new Date(device.createdAt).getTime()
          ) {
            allDatesAreAfterCreatedAt = false;
            enddate = ele.endtimestamp;
          }
        }
        //check validation with commissioning Date
        if (device && device.commissioningDate) {
          if (
            new Date(ele.endtimestamp).getTime() <=
            new Date(device.commissioningDate).getTime()
          ) {
            allDatesAreAftercommissioningDate = false;
            enddate = ele.endtimestamp;
          }
        }

        //check validation with System Date
        if (new Date(ele.endtimestamp).getTime() > new Date().getTime()) {
          allEndDatesAreBeforSystemDate = false;
          enddate = ele.endtimestamp;
        }
      });
      if (datesContainingNullOrEmptyValues) {
        this.logger.error(
          `One ore more End Date values are not sent for ${measurements.type},  end date is required`,
        );
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message: `One ore more End Date values are not sent for ${measurements.type},  end date is required`,
            }),
          );
        });
      }
      if (!datevalid1) {
        this.logger.error(
          `Invalid  End Date, valid format is  YYYY-MM-DDThh:mm:ss.millisecondsZ example 2022-10-18T11:35:27.640Z`,
        );
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message:
                ' Invalid  End Date, valid format is  YYYY-MM-DDThh:mm:ss.millisecondsZ example 2022-10-18T11:35:27.640Z ',
            }),
          );
        });
      }
      if (
        measurements.timezone !== null &&
        measurements.timezone !== undefined &&
        measurements.timezone.toString().trim() !== ''
      ) {
        enddate = momentTimeZone.tz(enddate, measurements.timezone);
        currentdate = momentTimeZone
          .tz(currentdate, measurements.timezone)
          .toDate();
      }
      if (!allDatesAreAfterCreatedAt) {
        this.logger.error(
          `One or more measurements endtimestamp ${enddate} is less than or equal to device onboarding date ${device?.createdAt}`,
        );
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message: `One or more measurements endtimestamp ${enddate} is less than or equal to device onboarding date ${device?.createdAt}`,
            }),
          );
        });
      }
      if (!allDatesAreAftercommissioningDate) {
        this.logger.error(
          `One or more measurements endtimestamp ${enddate} should be greater than to device commissioningDate date${device?.commissioningDate}`,
        );
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message: `One or more measurements endtimestamp ${enddate} should be greater than to device commissioningDate date${device?.commissioningDate}`,
            }),
          );
        });
      }
      if (!allEndDatesAreBeforSystemDate) {
        this.logger.error(
          `One or more measurements endtimestamp ${enddate} is greater than current date ${currentdate}`,
        );
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message: `One or more measurements endtimestamp ${enddate} is greater than current date ${currentdate}`,
            }),
          );
        });
      }
    }

    // negative value validation
    if (
      measurements.type === ReadType.History ||
      measurements.type === ReadType.Delta
    ) {
      let readvalue = true;
      measurements.reads.forEach((ele) => {
        if (ele.value <= 0) {
          readvalue = false;
        }
      });
      if (!readvalue) {
        this.logger.error(`meter read value should be greater then 0`);
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message: `meter read value should be greater then 0 `,
            }),
          );
        });
      }
    }
    // device organization and user organization validation
    if (device && device.organizationId !== organizationId) {
      this.logger.error(
        `Device doesnt belongs to the requested users organization`,
      );
      return new Promise((resolve, reject) => {
        reject(
          new ConflictException({
            success: false,
            message: `Device doesnt belongs to the requested users organization`,
          }),
        );
      });
    }

    if (measurements.reads.length > 1) {
      this.logger.error(`can not allow multiple reads simultaneously`);
      return new Promise((resolve, reject) => {
        reject(
          new ConflictException({
            success: false,
            message: `can not allow multiple reads simultaneously `,
          }),
        );
      });
    }
    return await this.internalReadsService.newstoreRead(
      device.externalId,
      measurements,
    );
  }

  /**
   * this api create for last read of device by external id
   * @returns {enddate:DateTime,value:number}
   */
  @Get('/latestread/:externalId')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the latest meter read of the given device',
  })
  @UseGuards(AuthGuard(['jwt', 'oauth2-client-password']), PermissionGuard)
  @Permission('Read')
  @ACLModules('READS_MANAGEMENT_CRUDL')
  public async getLatestMeterRead(
    @Param('externalId') externalId: string,

    @UserDecorator() user: ILoggedInUser,
  ) {
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
      device = await this.deviceService.findDeviceByDeveloperExternalId(
        externalId,
        user.organizationId,
      );
    }

    if (device === null) {
      return new Promise((resolve, reject) => {
        reject(
          new ConflictException({
            success: false,
            message: `Invalid device id`,
          }),
        );
      });
    }

    let deviceExternalId;
    let latestReadObject;
    let latestRead;

    deviceExternalId = device.externalId;

    if (!device.meterReadtype) {
      this.logger.error(`Read not found`);
      throw new HttpException('Read not found', 400);
    } else {
      latestReadObject = await this.internalReadsService.latestread(
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
      if (user.role === 'Buyer') {
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

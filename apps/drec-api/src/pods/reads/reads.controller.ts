import {
  AggregateFilterDTO,
  BaseReadsController,
  FilterDTO,
  AggregatedReadDTO,
  ReadDTO,
  ReadsService as BaseReadsService,
  MeasurementDTO,
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
  ConflictException
} from '@nestjs/common';
import { DateTime } from 'luxon';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BASE_READ_SERVICE } from './const';
import { ReadsService } from './reads.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../user/decorators/roles.decorator';
import { RolesGuard } from '../../guards/RolesGuard';
import { Role } from '../../utils/enums';
import { NewIntmediateMeterReadDTO } from '../reads/dto/intermediate_meter_read.dto'
import { Device, DeviceService } from '../device';
import moment from 'moment';
import { UserDecorator } from '../user/decorators/user.decorator';
import { ILoggedInUser } from '../../models';
import { DeviceDTO } from '../device/dto';
import { ReadType } from '../../utils/enums'
@Controller('meter-reads')
@ApiBearerAuth('access-token')
@ApiTags('meter-reads')
export class ReadsController extends BaseReadsController {
  constructor(
    private internalReadsService: ReadsService,
    private deviceService: DeviceService,
    @Inject(BASE_READ_SERVICE)
    baseReadsService: BaseReadsService,
  ) {
    super(baseReadsService);
  }

  @Get('/:meter')
  @ApiResponse({
    status: HttpStatus.OK,
    type: [ReadDTO],
    description: 'Returns time-series of meter reads',
  })
  @UseGuards(AuthGuard('jwt'))
  public async getReads(
    @Param('meter') meterId: string,
    @Query() filter: FilterDTO,
  ): Promise<ReadDTO[]> {
    return super.getReads(meterId, filter);
  }

  @Get('/:meter/difference')
  @ApiResponse({
    status: HttpStatus.OK,
    type: [ReadDTO],
    description:
      'Returns time-series of difference between subsequent meter reads',
  })
  @UseGuards(AuthGuard('jwt'))
  public async getReadsDifference(
    @Param('meter') meterId: string,
    @Query() filter: FilterDTO,
  ): Promise<ReadDTO[]> {
    return super.getReadsDifference(meterId, filter);
  }

  @Get('group/:groupId/aggregate')
  @ApiResponse({
    status: HttpStatus.OK,
    type: [AggregatedReadDTO],
    description:
      'Returns aggregated time-series of difference between subsequent meter reads',
  })
  public async getGroupAggregatedReads(
    @Param('groupId') groupId: number,
    @Query() filter: AggregateFilterDTO,
  ): Promise<AggregatedReadDTO[]> {
    return this.internalReadsService.getGroupAggregatedReads(groupId, filter);
  }

  @Get('/:meter/aggregate')
  @ApiResponse({
    status: HttpStatus.OK,
    type: [AggregatedReadDTO],
    description:
      'Returns aggregated time-series of difference between subsequent meter reads',
  })
  public async getReadsAggregates(
    @Param('meter') meterId: string,
    @Query() filter: AggregateFilterDTO,
  ): Promise<AggregatedReadDTO[]> {
    return super.getReadsAggregates(meterId, filter);
  }

  @Post('/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Admin, Role.DeviceOwner, Role.OrganizationAdmin)
  public async storeReads(
    @Param('id') id: string,
    @Body() measurements: MeasurementDTO,
  ): Promise<void> {
    return await this.internalReadsService.storeRead(id, measurements);
  }
  @Post('new/:id')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'New meter reads for historical data, Delta readings and Aggregate Readings',
    type: [NewIntmediateMeterReadDTO],
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Admin, Role.DeviceOwner, Role.OrganizationAdmin)
  public async newstoreRead(
    @Param('id') id: string,
    @Body() measurements: NewIntmediateMeterReadDTO,
    @UserDecorator() user: ILoggedInUser,
  ): Promise<void> {

    let device: DeviceDTO | null = await this.deviceService.findReads(id);

    if (device === null) {

      return new Promise((resolve, reject) => {
        reject(
          new ConflictException({
            success: false,
            message: `Invalid device id`,
          })
        );
      });
    }


    //check for according to read type if start time stamp and end time stamps are sent
    if (measurements.type === ReadType.History) {
      let datesContainingNullOrEmptyValues: boolean = false;
      measurements.reads.forEach(ele => {
        //@ts-ignore
        if (ele.starttimestamp === null || ele.starttimestamp === undefined || ele.starttimestamp === "" || ele.endtimestamp === null || ele.endtimestamp === undefined || ele.endtimestamp === "") {
          datesContainingNullOrEmptyValues = true;
        }
      });



      if (datesContainingNullOrEmptyValues) {
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message: 'One ore more Start Date and End Date values are not sent for History, start and end date is required for History meter ready type',
            }),
          );
        });
      }
    }
    if (measurements.type === ReadType.Delta || measurements.type === ReadType.ReadMeter) {
      let datesContainingNullOrEmptyValues: boolean = false;
      measurements.reads.forEach(ele => {
        //@ts-ignore
        if (ele.endtimestamp === null || ele.endtimestamp === undefined || ele.endtimestamp === "") {
          datesContainingNullOrEmptyValues = true;
        }
      });
      if (datesContainingNullOrEmptyValues) {
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message: `One ore more End Date values are not sent for ${measurements.type},  end date is required`,
            }),
          );
        });
      }
    }
    // Date format vaildation
    if (measurements.type === ReadType.History) {

      let datevalid1: boolean = true;
      let datevalid2: boolean = true;
      measurements.reads.forEach(ele => {
        console.log("Date fornat vaildation");

        let dateFormateToCheck = new RegExp(/\d\d\d\d\-\d\d\-\d\dT\d\d:\d\d:\d\d\.\d{1,}Z/);
        console.log(dateFormateToCheck);
        //@ts-ignore
        let startdateformate = dateFormateToCheck.test(ele.starttimestamp);
        console.log("startdateformate");
        console.log(startdateformate);
        //@ts-ignore
        let enddateformate = dateFormateToCheck.test(ele.endtimestamp);
        console.log(enddateformate);
        if (!startdateformate || !enddateformate) {
          datevalid1 = false;
        }
        // moment().format('YYYY-MM-DDTHH:mm:ssZ');

        const dateFormat = 'YYYY-MM-DDTHH:mm:ssZ';
        const fromDateFormat = moment(ele.starttimestamp).format(dateFormat);
        const toDateFormat = moment(new Date(ele.endtimestamp)).format(dateFormat);
        console.log(moment(fromDateFormat, dateFormat, true).isValid());
        var reqstartDate = moment(fromDateFormat, dateFormat, true).isValid();
        console.log(reqstartDate);

        var reqendtDate = moment(toDateFormat, dateFormat, true).isValid();
        console.log(reqendtDate);
        if (!reqstartDate || !reqendtDate) {
          datevalid2 = false;
        }

      })

      if (!datevalid1 || !datevalid2) {
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message: ' Invalid Start Date and/or End Date, valid format is  YYYY-MM-DDThh:mm:ss.millisecondsZ example 2022-10-18T11:35:27.640Z ',
            }),
          );
        });
      }
    }


    if (measurements.type === ReadType.Delta || measurements.type === ReadType.ReadMeter) {
      let datevalid1: boolean = true;
      let datevalid2: boolean = true;
      measurements.reads.forEach(ele => {
        console.log("Date fornat vaildation");

        let dateFormateToCheck = new RegExp(/\d\d\d\d\-\d\d\-\d\dT\d\d:\d\d:\d\d\.\d{1,}Z/);
        console.log(dateFormateToCheck);

        //@ts-ignore
        let enddateformate = dateFormateToCheck.test(ele.endtimestamp);
        console.log(enddateformate);
        if (!enddateformate) {
          datevalid1 = false;
        }
        // moment().format('YYYY-MM-DDTHH:mm:ssZ');

        const dateFormat = 'YYYY-MM-DDTHH:mm:ssZ';

        const toDateFormat = moment(new Date(ele.endtimestamp)).format(dateFormat);
        var reqendtDate = moment(toDateFormat, dateFormat, true).isValid();
        console.log(reqendtDate);
        if (!reqendtDate) {
          datevalid2 = false;
        }

      })

      if (!datevalid1 || !datevalid2) {
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message: ' Invalid  End Date, valid format is  YYYY-MM-DDThh:mm:ss.millisecondsZ example 2022-10-18T11:35:27.640Z ',
            }),
          );
        });
      }

    }
    // Device onboarding and system date validation
    if (measurements.type === ReadType.Delta || measurements.type === ReadType.ReadMeter) {
      let allDatesAreAfterCreatedAt: boolean = true;
      measurements.reads.forEach(ele => {
        if (device && device.createdAt) {
          if (new Date(ele.endtimestamp).getTime() < new Date(device.createdAt).getTime()) {
            allDatesAreAfterCreatedAt = false;
          }
        }
      })
      if (!allDatesAreAfterCreatedAt) {
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message: `One or more measurements endtimestamp is less than device onboarding date${device?.createdAt}`,
            })
          );
        });
      }
    }
    if (measurements.type === ReadType.Delta || measurements.type === ReadType.ReadMeter) {
      let allEndDatesAreBeforSystemDate: boolean = true;
      measurements.reads.forEach(ele => {
        if (device && device.createdAt) {

          if (new Date(ele.endtimestamp).getTime() > new Date().getTime()) {
            allEndDatesAreBeforSystemDate = false;
          }
        }
      })
      if (!allEndDatesAreBeforSystemDate) {
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message: `One or more measurements endtimestamp is greater than current date`,
            })
          );
        });
      }
    }

    if (measurements.type === ReadType.History) {
      let allDatesAreBeforeCreatedAt: boolean = true;
      let allStartDatesAreBeforeEnddate: boolean = true;
      let readvalue: boolean = true;
      measurements.reads.forEach(ele => {
        if (device && device.createdAt) {
          if (new Date(ele.endtimestamp).getTime() > new Date(device.createdAt).getTime()) {
            allDatesAreBeforeCreatedAt = false;
          }
          if (new Date(ele.starttimestamp).getTime() > new Date(device.createdAt).getTime()) {
            allDatesAreBeforeCreatedAt = false;
          }
          if (new Date(ele.starttimestamp).getTime() > new Date(ele.endtimestamp).getTime()) {
            allStartDatesAreBeforeEnddate = false;
          }
        }

        if (ele.value < 0) {
          readvalue = false;
        }
      })
      if (!allStartDatesAreBeforeEnddate) {
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message: `starttimestamp should be prior to endtimestamp. One or more measurements starttimestamp is greater than endtimestamp `,
            })
          );
        });
      }
      if (!allDatesAreBeforeCreatedAt) {
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message: `For History reading starttimestamp and endtimestamp should be prior to device onboarding date. One or more measurements endtimestamp and or starttimestamp is greater than device onboarding date${device?.createdAt}`,
            })
          );
        });
      }

      if (!readvalue) {
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message: `meter read value should be greater then 0 `,
            })
          );
        });
      }
    }
    // negative value validation
    if (measurements.type === ReadType.History || measurements.type === ReadType.Delta) {

      let readvalue: boolean = true;
      measurements.reads.forEach(ele => {
        if (ele.value <= 0) {
          readvalue = false;
        }
      })
      if (!readvalue) {
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message: `meter read value should be greater then 0 `,
            })
          );
        });
      }
    }
    // device organization and user organization validation
    if (device && device.organizationId !== user.organizationId) {
      return new Promise((resolve, reject) => {
        reject(
          new ConflictException({
            success: false,
            message: `Device doesnt belongs to the requested users organization`,
          })
        );
      });
    }

    if (measurements.reads.length > 1) {
      return new Promise((resolve, reject) => {
        reject(
          new ConflictException({
            success: false,
            message: `can not allow multiple reads simultaneously `,
          })
        );
      });
    }
    return await this.internalReadsService.newstoreRead(id, measurements);
  }
}

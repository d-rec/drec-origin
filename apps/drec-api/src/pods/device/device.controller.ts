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
  HttpException
} from '@nestjs/common';

import moment from 'moment';

import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiResponse,
  ApiOkResponse,
  ApiSecurity,
  ApiTags,
  ApiQuery,
  ApiHideProperty,
  ApiBody
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
  BuyerDeviceFilterDTO
} from './dto';
import {
  CSVBulkUploadDTO,

} from '../device-group/dto';
import { Role } from '../../utils/enums';
import { RolesGuard } from '../../guards/RolesGuard';
import { PermissionGuard } from '../../guards/PermissionGuard'
import { ILoggedInUser } from '../../models';
import { CodeNameDTO } from './dto/code-name.dto';
import { ActiveUserGuard } from '../../guards';
import { Roles } from '../user/decorators/roles.decorator';
import { UserDecorator } from '../user/decorators/user.decorator';
import { DeviceGroupService } from '../device-group/device-group.service';
import { Permission } from '../permission/decorators/permission.decorator';
import { ACLModules } from '../access-control-layer-module-service/decorator/aclModule.decorator';
import { CountrycodeService } from '../countrycode/countrycode.service';
import { countryCodesList } from '../../models/country-code'
import { isValidUTCDateFormat } from '../../utils/checkForISOStringFormat';
import { OrganizationInvitationStatus } from '@energyweb/origin-backend-core';
import { DeviceGroup } from '../device-group/device-group.entity';
import { DeviceCsvFileProcessingJobsEntity, StatusCSV } from '../device-group/device_csv_processing_jobs.entity';
import { Device } from './device.entity';

/**
* It is Controller of device with the endpoints of device operations.
*/
@ApiTags('device')
@ApiBearerAuth('access-token')
@ApiSecurity('drec')
@Controller('/device')
export class DeviceController {
  constructor(
    private readonly deviceGroupService: DeviceGroupService,
    private readonly deviceService: DeviceService,
    private countrycodeService: CountrycodeService,
  ) { }

  /**
  * It is GET api to list all devices with paginatiion and fiteration by organization and filterationDto
  */
  @Get()
  @UseGuards(AuthGuard('jwt'), ActiveUserGuard, RolesGuard,PermissionGuard)
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
  )/*: Promise<DeviceDTO[]>*/ {
    return this.deviceService.find(filterDto, pagenumber,OrgId);
  }

  /**
  * It is GET api to list all devices for reservation
  * @return {Array<DeviceDTO>} return array of devices for reservation 
  */
  @Get('/ungrouped/buyerreservation')
  @UseGuards(AuthGuard('jwt'),PermissionGuard)
  @Permission('Read')
  @ACLModules('DEVICE_MANAGEMENT_CRUDL')
  // @UseGuards(AuthGuard('jwt'), ActiveUserGuard, RolesGuard)
  //@Roles(Role.Admin)
  @ApiOkResponse({ type: [DeviceDTO], description: 'Returns all Devices' })
  async getAllDeviceForBuyer(
    @Query(ValidationPipe) filterDto: FilterDTO,
    @Query('pagenumber') pagenumber: number | null,
  ): Promise<DeviceDTO[]> {

    return this.deviceService.finddeviceForBuyer(filterDto, pagenumber);
  }

  /**
  * It is GET api to list all ungrouped devices with filteration
  * @return {GroupedDevicesDTO} returns ungrouped devices
  */
  @Get('/ungrouped')
  @UseGuards(AuthGuard('jwt'), ActiveUserGuard, RolesGuard,PermissionGuard)
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
    const fuelTypes = this.deviceService.getFuelTypes();
    return fuelTypes.map((fuelType) => plainToClass(CodeNameDTO, fuelType));
  }

  /**
   * It is GET api to list all my devices with filteration and pagination
   * @returns {Array<DeviceDTO>}
   */
  @Get('/my')
  @UseGuards(AuthGuard('jwt'), AuthGuard('oauth2-client-password'), ActiveUserGuard, PermissionGuard)
  @Permission('Read')
  @ACLModules('DEVICE_MANAGEMENT_CRUDL')
  //@Roles(Role.OrganizationAdmin, Role.DeviceOwner)
  @ApiQuery({ name: 'pagenumber', type: Number, required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [DeviceDTO],
    description: 'Returns my Devices',
  })
  async getMyDevices(
    @Query(ValidationPipe) filterDto: FilterDTO,
    @UserDecorator() { organizationId, api_user_id, role }: ILoggedInUser,
    @Query('pagenumber') pagenumber: number | null
  )/*: Promise<DeviceDTO[]>*/ {
    
    if (filterDto.country) {
      filterDto.country = filterDto.country.toUpperCase();
     
      if (filterDto.country && typeof filterDto.country === "string" && filterDto.country.length === 3) {
        let countries = countryCodesList;
        if (countries.find(ele => ele.countryCode === filterDto.country) === undefined) {
          return new Promise((resolve, reject) => {
            reject(
              new ConflictException({
                success: false,
                message: ' Invalid countryCode, some of the valid country codes are "GBR" - "United Kingdom of Great Britain and Northern Ireland",  "CAN" - "Canada"  "IND" - "India", "DEU"-  "Germany"',
              }),
            );
          });
        }
      } else {
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message: ' Invalid countryCode, some of the valid country codes are "GBR" - "United Kingdom of Great Britain and Northern Ireland",  "CAN" - "Canada"  "IND" - "India", "DEU"-  "Germany"',
            }),
          );
        });
      }
    }
    //@ts-ignore
    if(filterDto.organizationId) {
      //@ts-ignore
      organizationId = filterDto.organizationId;
    }
    return await this.deviceService.getOrganizationDevices(organizationId, api_user_id, role, filterDto, pagenumber);
  }

  /**
   * It is GET api to fetch an device by the deviceId in param
   * @param id is deviceId in type number
   * @returns {DeviceDTO | null} DeviceDto for success response and null when there is no device found by the id
   */
  @Get('/:id')
  @UseGuards(AuthGuard('jwt'), AuthGuard('oauth2-client-password'), ActiveUserGuard, PermissionGuard)
  @Permission('Read')
  @ACLModules('DEVICE_MANAGEMENT_CRUDL')
  //@Roles(Role.Admin)
  @ApiOkResponse({ type: DeviceDTO, description: 'Returns a Device' })
  @ApiNotFoundResponse({
    description: `The device with the code doesn't exist`,
  })
  async get(@Param('id') id: number,
  @Query('apiUserId') api_user_id: string | null,
  @Query('organizationId') organizationId: number | null,
  ): Promise<DeviceDTO | null> {
    let devicedata : Device;
    if(api_user_id && organizationId) {
      devicedata = await this.deviceService.findOne(id,{
        where : {
          api_user_id : api_user_id,
          organizationId : organizationId
        }
      });
    }
    else {
      devicedata = await this.deviceService.findOne(id);
    }
    console.log(devicedata);
    devicedata.externalId = devicedata.developerExternalId;
    delete devicedata["developerExternalId"];
    return devicedata
  }

  /**
   * It is GET api to fetch an device by externalId in param
   * @param id  is externalId in device 
   * @param param1 
   * @returns {DeviceDTO | null} DeviceDto for success response and null when there is no device found by the id
   */
  @Get('externalId/:id')
  @UseGuards(AuthGuard('jwt'),PermissionGuard)
  @Permission('Read')
  @ACLModules('DEVICE_MANAGEMENT_CRUDL')
  @ApiOkResponse({ type: DeviceDTO, description: 'Returns a Device' })
  @ApiNotFoundResponse({
    description: `The device with the code doesn't exist`,
  })
  async getByExternalId(@Param('id') id: string,
    @UserDecorator() { organizationId }: ILoggedInUser,
  ): Promise<DeviceDTO | null> {
    console.log(id);
    const devicedata = await this.deviceService.findDeviceByDeveloperExternalId(id, organizationId);
    console.log(devicedata);
    devicedata.externalId = devicedata.developerExternalId;
    delete devicedata["developerExternalId"];
    return devicedata;
  }

  /**
   * It is POST api to create an device
   * @param param0 It is organizationId from user at request
   * @param deviceToRegister It is body payload to create device
   * @returns {DeviceDTO}
   */
  @Post()
  @UseGuards(AuthGuard('jwt'), AuthGuard('oauth2-client-password'), PermissionGuard)
  @Permission('Write')
  @ACLModules('DEVICE_MANAGEMENT_CRUDL')
  //@Roles(Role.Admin, Role.DeviceOwner, Role.OrganizationAdmin)
  @ApiResponse({
    status: HttpStatus.OK,
    type: NewDeviceDTO,
    description: 'Returns a new created Device id',
  })
  public async create(
    @UserDecorator() { organizationId, role, api_user_id }: ILoggedInUser,
    @Body() deviceToRegister: NewDeviceDTO,
  ): Promise<DeviceDTO> {
    console.log(deviceToRegister);
    deviceToRegister.externalId = deviceToRegister.externalId.trim();
    if (deviceToRegister.externalId.trim() === "") {
      return new Promise((resolve, reject) => {
        reject(
          new ConflictException({
            success: false,
            message: `externalId should not be empty`,
          })
        );
      });
    }


    if (!isValidUTCDateFormat(deviceToRegister.commissioningDate)) {
      return new Promise((resolve, reject) => {
        reject(
          new ConflictException({
            success: false,
            message: ' Invalid commissioning date, valid format is  YYYY-MM-DDThh:mm:ss.millisecondsZ example 2022-10-18T11:35:27.640Z ',
          }),
        );
      });
    }
    if (new Date(deviceToRegister.commissioningDate).getTime() > new Date().getTime()) {
      return new Promise((resolve, reject) => {
        reject(
          new ConflictException({
            success: false,
            message: ` Invalid commissioning date, commissioning is greater than current date`,
          })
        );
      });
    }
    if (deviceToRegister['groupId'] === 0 || deviceToRegister['groupId']) {
      deviceToRegister['groupId'] = null;
    }
    deviceToRegister.countryCode = deviceToRegister.countryCode.toUpperCase();
    if (deviceToRegister.countryCode && typeof deviceToRegister.countryCode === "string" && deviceToRegister.countryCode.length === 3) {
      let countries = countryCodesList;
      if (countries.find(ele => ele.countryCode === deviceToRegister.countryCode) === undefined) {
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message: ' Invalid countryCode, some of the valid country codes are "GBR" - "United Kingdom of Great Britain and Northern Ireland",  "CAN" - "Canada"  "IND" - "India", "DEU"-  "Germany"',
            }),
          );
        });
      }
    } else {
      return new Promise((resolve, reject) => {
        reject(
          new ConflictException({
            success: false,
            message: ' Invalid countryCode, some of the valid country codes are "GBR" - "United Kingdom of Great Britain and Northern Ireland",  "CAN" - "Canada"  "IND" - "India", "DEU"-  "Germany"',
          }),
        );
      });
    }
    if (isNaN(parseFloat(deviceToRegister.capacity.toString()))) {
      return new Promise((resolve, reject) => {
        reject(
          new ConflictException({
            success: false,
            message: ' Invalid Capacity or energy Storage Capacity',
          }),
        );
      });
    }
    if (deviceToRegister.capacity <= 0 || deviceToRegister.energyStorageCapacity < 0) {
      return new Promise((resolve, reject) => {
        reject(
          new ConflictException({
            success: false,
            message: ' Invalid Capacity or energy Storage Capacity, it should be greater than 0',
          }),
        );
      });
    }
    if (deviceToRegister.version === null || deviceToRegister.version === undefined || deviceToRegister.version === '0') {
      deviceToRegister.version = '1.0';
    }
    //@ts-ignore
    if (deviceToRegister.organizationId) {
      console.log("314")
      //@ts-ignore
      console.log(deviceToRegister.organizationId)
      //@ts-ignore
      organizationId = deviceToRegister.organizationId
    }
    return await this.deviceService.register(organizationId, deviceToRegister, api_user_id, role);

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
    console.log(deviceToUpdate);

    if (deviceToUpdate.externalId) {
      deviceToUpdate.externalId = deviceToUpdate.externalId.trim();
      if (deviceToUpdate.externalId === "") {
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message: `externalId should not be empty`,
            })
          );
        });
      }

      const checkexternalid = await this.deviceService.findDeviceByDeveloperExternalId(
        deviceToUpdate.externalId,
        user.organizationId
      );
      console.log(checkexternalid)
      if (checkexternalid != undefined && checkexternalid.developerExternalId === externalId.trim()) {
        console.log("236");
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message: `ExternalId already exist in this organization, can't update with same external id ${deviceToUpdate.externalId}`,

            })
          );
        });
      }
    }

    if (deviceToUpdate.countryCode != undefined) {
      deviceToUpdate.countryCode = deviceToUpdate.countryCode.toUpperCase();
      if (deviceToUpdate.countryCode && typeof deviceToUpdate.countryCode === "string" && deviceToUpdate.countryCode.length === 3) {
        let countries = countryCodesList;
        if (countries.find(ele => ele.countryCode === deviceToUpdate.countryCode) === undefined) {
          return new Promise((resolve, reject) => {
            reject(
              new ConflictException({
                success: false,
                message: ' Invalid countryCode, some of the valid country codes are "GBR" - "United Kingdom of Great Britain and Northern Ireland",  "CAN" - "Canada"  "IND" - "India", "DEU"-  "Germany"',
              }),
            );
          });
        }
      } else {
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message: ' Invalid countryCode, some of the valid country codes are "GBR" - "United Kingdom of Great Britain and Northern Ireland",  "CAN" - "Canada"  "IND" - "India", "DEU"-  "Germany"',
            }),
          );
        });
      }
    }


    if (deviceToUpdate.capacity <= 0) {
      return new Promise((resolve, reject) => {
        reject(
          new ConflictException({
            success: false,
            message: ' Invalid Capacity, it should be greater than 0',
          }),
        );
      });
    }
    // var commissioningDate = moment(deviceToUpdate.commissioningDate);

    if (!isValidUTCDateFormat(deviceToUpdate.commissioningDate) && deviceToUpdate.commissioningDate !== undefined) {
      return new Promise((resolve, reject) => {
        reject(
          new ConflictException({
            success: false,
            message: ' Invalid commissioning date, valid format is  YYYY-MM-DDThh:mm:ss.millisecondsZ example 2022-10-18T11:35:27.640Z ',
          }),
        );
      });
    }
    if (new Date(deviceToUpdate.commissioningDate).getTime() > new Date().getTime()) {
      return new Promise((resolve, reject) => {
        reject(
          new ConflictException({
            success: false,
            message: ` Invalid commissioning date, commissioning is greater than current date`,
          })
        );
      });
    }

    if(deviceToUpdate.commissioningDate) {
      const checkexternalid = await this.deviceService.findDeviceByDeveloperExternalId(
        externalId,
        user.organizationId
      );
      const noOfHistRead : number = await this.deviceService.getNumberOfHistReads(checkexternalid.externalId);
      const noOfOnGoingRead : number = await this.deviceService.getNumberOfOngReads(checkexternalid.externalId,checkexternalid.createdAt);
      
      if(deviceToUpdate.commissioningDate != checkexternalid.commissioningDate) {
        if(noOfHistRead > 0 || noOfOnGoingRead > 0) {
          throw new ConflictException({
            success : false,
            message: ` Commissioning date cannot be changed due to existing meter reads available for ${checkexternalid.developerExternalId}`,
          })
        }

        if(new Date(deviceToUpdate.commissioningDate).getTime() > new Date(checkexternalid.createdAt).getTime()) {
          throw new ConflictException({
            success : false,
            message: `Invalid commissioning date, commissioning is greater than device onboarding date`
          })
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
  @UseGuards(AuthGuard('jwt'), RolesGuard,PermissionGuard)
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
    const checkisungroup = this.deviceService.findUngroupedById(id)
    console.log(checkisungroup)
    if (checkisungroup) {
      let fitlerop: any;
      if (role === 'Admin') {
        fitlerop = {
          groupId: null
        }
      } else {
        fitlerop = {
          groupId: null,
          organizationId: organizationId
        }
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
  //@Roles(Role.OrganizationAdmin, Role.DeviceOwner)
  @ApiResponse({
    status: HttpStatus.OK,
    type: [DeviceDTO],
    description: 'Returns my Devices',
  })
  async getMyDevicesTotal(
    @UserDecorator() { organizationId }: ILoggedInUser,
  ): Promise<DeviceDTO[]> {
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
  @ApiQuery({ name: 'givenDate', description: 'Update the OnBoarding date', type: Date, })
  async changeOnBoardingDate(
    @UserDecorator() { organizationId }: ILoggedInUser,
    @Query('deviceId') deviceId,
    @Query('givenDate') givenDate
  ) {
    if (process.env.MODE != 'dev') {
      throw new HttpException("Currently not in dev environment", 400)
    }
    let device: DeviceDTO | null = await this.deviceService.findDeviceByDeveloperExternalId(deviceId, organizationId);
    console.log("THE DEVICE FROM ExTERNALID IS::::::::::::" + device.externalId);
    if (!device) {
      throw new HttpException("Device dosen't exist", 400);
    }
    const deviceExternalId = device.externalId;
    const deviceOnboardedDate = device.createdAt;
    return this.deviceService.changeDeviceCreatedAt(deviceExternalId, deviceOnboardedDate, givenDate);
  }

  /* */

  //////////////////////////////////////////////////


  // @Get('/autocomplete')
  //   @UseGuards(AuthGuard('jwt'), ActiveUserGuard, PermissionGuard)
  //   @Permission('Read')
  //   @ACLModules('DEVICE_MANAGEMENT_CRUDL')
  //   //@Roles(Role.OrganizationAdmin, Role.DeviceOwner)
  //   @ApiResponse({
  //     status: HttpStatus.OK,
  //     type: [DeviceDTO],
  //     description: 'Returns auto corrected externalIDs and other data',
  //   })

  //   // @ApiQuery({ name: 'externalId', description: 'externalId',type:Number })

  //   async autocomplete(
  //     @UserDecorator() { organizationId }: ILoggedInUser,
  //     // @Query('externalId') externalId :Number,

  //   ){
  //     return await this.deviceService.atto(organizationId);
  //   }

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
  //@Roles(Role.OrganizationAdmin, Role.DeviceOwner)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns Auto-Complete',
  })

  @ApiQuery({ name: 'externalId', description: 'externalId', type: String })

  async autocomplete(
    @UserDecorator() { organizationId }: ILoggedInUser,
    @Query('externalId') externalId: String,

  ) {
    
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
  @UseGuards(AuthGuard('jwt'),PermissionGuard)
  @Permission('Read')
  @ACLModules('DEVICE_MANAGEMENT_CRUDL')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns Certified log date rang of Device',
  })
  async certifiedlogdaterang(
    @UserDecorator() user: ILoggedInUser,
    @Query('externalId') externalId: number,
    @Query('groupUid') groupuId: string,
  ): Promise<any> {
    // console.log(externalId);
    // console.log(groupuId)

    const regexExp = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/;
    if (groupuId === null || !regexExp.test(groupuId)) {
      return new Promise((resolve, reject) => {
        reject(new ConflictException({
          success: false,
          message: ' Please Add the valid UID ,invalid group uid value was sent',
        }))
      })
    }

    let device: DeviceDTO | null

    device = await this.deviceService.findOne(externalId);
    /// console.log(device);
    if (device === null) {
      return new Promise((resolve, reject) => {
        reject(new ConflictException({
          success: false,
          message: 'device not found, invalid value was sent',
        }))
      })
    }
    let group: DeviceGroup | null
    group = await this.deviceGroupService.findOne({ devicegroup_uid: groupuId })
    // console.log(group);
    if (group === null || group.buyerId != user.id) {
      return new Promise((resolve, reject) => {
        reject(new ConflictException({
          success: false,
          message: 'Group UId is not of this buyer, invalid value was sent',
        }))
      })
    }
    return await this.deviceService.getcertifieddevicedaterange(device, group.id);
  }
  // @Get('/certified/date-range-log')
  // @UseGuards(AuthGuard('jwt'))
  // @ApiResponse({
  //   status: HttpStatus.OK,
  //   description: 'Returns Auto-Complete',
  // })
  // async devicecertifiedlogdaterange() {

  //   return "await this.deviceService.atto(organizationId, externalId)";
  // }
  /////////////////////////////////////////////////
  /**
   * It is POST api to create array of devices by uploading csv files with device data 
   * @param user is loggedIn user from request
   * @param organizationId is organization unique identifier with number type to map with the respective organization
   * @param fileToProcess is parsed data of uploaded csv file
   * @returns {DeviceCsvFileProcessingJobsEntity}
   */
  @Post('addByAdmin/process-creation-bulk-devices-csv/:organizationId')
  @UseGuards(AuthGuard('jwt'),PermissionGuard)
  //@UseGuards(AuthGuard('jwt'), PermissionGuard)
  @Permission('Write')
  @ACLModules('DEVICE_BULK_MANAGEMENT_CRUDL')
  //@Roles(Role.Admin, Role.DeviceOwner,Role.OrganizationAdmin)
  @ApiResponse({
    status: HttpStatus.OK,
    type: [DeviceCsvFileProcessingJobsEntity],
    description: 'Returns created devices from csv',
  })
  @ApiBody({ type: CSVBulkUploadDTO })
  public async processCreationBulkFromCSV
    (@UserDecorator() user: ILoggedInUser,
      @Param('organizationId') organizationId: number | null,
      @Body() fileToProcess: CSVBulkUploadDTO): Promise<DeviceCsvFileProcessingJobsEntity> {
    if (organizationId === null || organizationId === undefined) {
      throw new ConflictException({
        success: false,
        message:
          'User needs to have organization added'
      })
    }
    console.log(fileToProcess.fileName);
    if (fileToProcess.fileName == undefined) {
      //throw new Error("file not found");
      throw new ConflictException({
        success: false,
        message:
          'File Not Found'
      })

    }
    if (!fileToProcess.fileName.endsWith('.csv')) {
      //throw new Error("file not found");
      throw new ConflictException({
        success: false,
        message:
          'Invalid file'
      })

    }
    let jobCreated = await this.deviceGroupService.createCSVJobForFile(user.id, organizationId, StatusCSV.Added, fileToProcess.fileName);

    //let jobCreated = await this.deviceGroupService.createCSVJobForFile(user.id, organizationId, StatusCSV.Added,  response.filename);

    return jobCreated;
  }

}
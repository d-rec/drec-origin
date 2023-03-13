import {
  Controller,
  Get,
  Post,
  Patch,
  HttpStatus,
  Param,
  Body,
  UseGuards,
  ValidationPipe,
  Query,
  ConflictException,
} from '@nestjs/common';

import moment from 'moment';

import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiResponse,
  ApiOkResponse,
  ApiSecurity,
  ApiTags,
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
import { countrCodesList } from '../../models/country-code'
import { isValidUTCDateFormat } from '../../utils/checkForISOStringFormat';
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

  @Get()
  @UseGuards(AuthGuard('jwt'), ActiveUserGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiOkResponse({ type: [DeviceDTO], description: 'Returns all Devices' })
  async getAll(
    @Query(ValidationPipe) filterDto: FilterDTO,
  ): Promise<DeviceDTO[]> {
    return this.deviceService.find(filterDto);
  }
  // @Get('/devicegroup')
  // @UseGuards(AuthGuard('jwt'), ActiveUserGuard, RolesGuard)
  // @Roles(Role.Admin)
  // @ApiOkResponse({ type: [DeviceDTO], description: 'Returns all Devices' })
  // async getAllgroupdevcie(

  // ): Promise<DeviceDTO[]> {
  //   return this.deviceService.NewfindForGroup(1);
  // }
  @Get('/ungrouped/buyerreservation')
  @UseGuards(AuthGuard('jwt'))
  // @UseGuards(AuthGuard('jwt'), ActiveUserGuard, RolesGuard)
  //@Roles(Role.Admin)
  @ApiOkResponse({ type: [DeviceDTO], description: 'Returns all Devices' })
  async getAllDeviceForBuyer(
    @Query(ValidationPipe) filterDto: BuyerDeviceFilterDTO,
  ): Promise<DeviceDTO[]> {
    return this.deviceService.finddeviceForBuyer(filterDto);
  }
  @Get('/ungrouped')
  @UseGuards(AuthGuard('jwt'), ActiveUserGuard, RolesGuard)
  @Roles(Role.Admin, Role.DeviceOwner)
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

  @Get('/my')
  @UseGuards(AuthGuard('jwt'), ActiveUserGuard, PermissionGuard)
  @Permission('Read')
  @ACLModules('DEVICE_MANAGEMENT_CRUDL')
  //@Roles(Role.OrganizationAdmin, Role.DeviceOwner)
  @ApiResponse({
    status: HttpStatus.OK,
    type: [DeviceDTO],
    description: 'Returns my Devices',
  })
  async getMyDevices(
    @UserDecorator() { organizationId }: ILoggedInUser,
  ): Promise<DeviceDTO[]> {
    return await this.deviceService.getOrganizationDevices(organizationId);
  }

  @Get('/:id')
  @UseGuards(AuthGuard('jwt'), ActiveUserGuard, PermissionGuard)
  @Permission('Read')
  @ACLModules('DEVICE_MANAGEMENT_CRUDL')
  //@Roles(Role.Admin)
  @ApiOkResponse({ type: DeviceDTO, description: 'Returns a Device' })
  @ApiNotFoundResponse({
    description: `The device with the code doesn't exist`,
  })
  async get(@Param('id') id: number): Promise<DeviceDTO | null> {
    return this.deviceService.findOne(id);
  }

  @Get('externalId/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOkResponse({ type: DeviceDTO, description: 'Returns a Device' })
  @ApiNotFoundResponse({
    description: `The device with the code doesn't exist`,
  })
  async getByExternalId(@Param('id') id: string): Promise<DeviceDTO | null> {
    return this.deviceService.findReads(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), PermissionGuard)
  @Permission('Write')
  @ACLModules('DEVICE_MANAGEMENT_CRUDL')
  //@Roles(Role.Admin, Role.DeviceOwner, Role.OrganizationAdmin)
  @ApiResponse({
    status: HttpStatus.OK,
    type: NewDeviceDTO,
    description: 'Returns a new created Device id',
  })
  public async create(
    @UserDecorator() { organizationId }: ILoggedInUser,
    @Body() deviceToRegister: NewDeviceDTO,
  ): Promise<DeviceDTO> {
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
      let countries = countrCodesList;
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
            message: ' Invalid Capacity',
          }),
        );
      });
    }
    if (deviceToRegister.capacity <= 0) {
      return new Promise((resolve, reject) => {
        reject(
          new ConflictException({
            success: false,
            message: ' Invalid Capacity, it should be greater than 0',
          }),
        );
      });
    }
    if (deviceToRegister.version === null || deviceToRegister.version === undefined) {
      deviceToRegister.version = '1.0';
    }
    return await this.deviceService.register(organizationId, deviceToRegister)
       .catch((error) => {
        console.log(error.error);
        return error
        
      //   if (error && error.code && error.detail) {
      //     return new Promise((resolve, reject) => {
      //       reject(
      //         new ConflictException({
      //           success: false,
      //           message: error.detail,
      //         }),
      //       );
      //     });
      //   } else {
      //     console.log("error", error);
      //     return new Promise((resolve, reject) => {
      //       reject({ error: true });
      //     });
       //}
       });

    //}
    // catch(e)
    // {
    //   if(e && e.code && e.detail)
    //   {
    //     return new Promise((resolve,reject)=>{
    //       reject(new ConflictException({
    //         success: false,
    //         message:e.detail}))
    //     })
    // }
    // else
    //   return new Promise((resolve,reject)=>{
    //     reject({error:true});
    //   })

    // }
  }


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
    if(deviceToUpdate.countryCode!=undefined){
      deviceToUpdate.countryCode = deviceToUpdate.countryCode.toUpperCase();
      if (deviceToUpdate.countryCode && typeof deviceToUpdate.countryCode === "string" && deviceToUpdate.countryCode.length === 3) {
        let countries = countrCodesList;
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
  
    if (!isValidUTCDateFormat(deviceToUpdate.commissioningDate) && deviceToUpdate.commissioningDate!== undefined) {
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
    return await this.deviceService.update(
      user.organizationId,
      user.role,
      externalId,
      deviceToUpdate,
    );
  }

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
}

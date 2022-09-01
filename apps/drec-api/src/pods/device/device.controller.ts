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
import {PermissionGuard} from '../../guards/PermissionGuard'
import { ILoggedInUser } from '../../models';
import { CodeNameDTO } from './dto/code-name.dto';
import { ActiveUserGuard } from '../../guards';
import { Roles } from '../user/decorators/roles.decorator';
import { UserDecorator } from '../user/decorators/user.decorator';
import { DeviceGroupService } from '../device-group/device-group.service';
import { Permission } from '../permission/decorators/permission.decorator';
import { ACLModules } from '../access-control-layer-module-service/decorator/aclModule.decorator';

@ApiTags('device')
@ApiBearerAuth('access-token')
@ApiSecurity('drec')
@Controller('/device')
export class DeviceController {
  constructor(
    private readonly deviceGroupService: DeviceGroupService,
    private readonly deviceService: DeviceService,
  ) {}

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
  @UseGuards(AuthGuard('jwt'), ActiveUserGuard, RolesGuard)
  @Roles(Role.Admin)
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
    if (deviceToRegister.groupId) {
      const response = await this.deviceGroupService.findById(
        deviceToRegister.groupId,
      );
      if (response && response.buyerAddress) {
        return new Promise((resolve, reject) => {
          reject(
            new ConflictException({
              success: false,
              message:
                'This Device Group already has buyer added device cannot be added to device group',
            }),
          );
        });
      }
    }

    // try
    // {
    return await this.deviceService
      .register(organizationId, deviceToRegister)
      .catch((error) => {
        if (error && error.code && error.detail) {
          return new Promise((resolve, reject) => {
            reject(
              new ConflictException({
                success: false,
                message: error.detail,
              }),
            );
          });
        } else {
          console.log("error",error);
          return new Promise((resolve, reject) => {
            reject({ error: true });
          });
        }
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

  @Patch('/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Admin, Role.DeviceOwner)
  @ApiResponse({
    status: HttpStatus.OK,
    type: UpdateDeviceDTO,
    description: 'Returns an updated Device',
  })
  @ApiNotFoundResponse({ description: `No device found` })
  public async update(
    @UserDecorator() user: ILoggedInUser,
    @Param('id') id: number,
    @Body() deviceToUpdate: UpdateDeviceDTO,
  ): Promise<DeviceDTO> {
    return await this.deviceService.update(
      user.organizationId,
      user.role,
      id,
      deviceToUpdate,
    );
  }
}

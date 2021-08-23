import {
  Controller,
  Get,
  Post,
  Patch,
  HttpStatus,
  Param,
  Body,
  UseGuards,
  Delete,
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

import { DeviceGroupService } from './device-group.service';
import {
  DeviceGroupDTO,
  DeviceIdsDTO,
  NewDeviceGroupDTO,
  UpdateDeviceGroupDTO,
} from './dto';
import { Roles } from '../user/decorators/roles.decorator';
import { Role } from '../../utils/enums';
import { RolesGuard } from '../../guards/RolesGuard';
import { UserDecorator } from '../user/decorators/user.decorator';
import { ILoggedInUser } from '../../models';

@ApiTags('device-group')
@ApiBearerAuth('access-token')
@ApiSecurity('drec')
@Controller('/device-group')
@UseGuards(AuthGuard('jwt'))
export class DeviceGroupController {
  constructor(private readonly deviceGroupService: DeviceGroupService) {}

  @Get()
  @ApiOkResponse({
    type: [DeviceGroupDTO],
    description: 'Returns all Device groups',
  })
  async getAll(): Promise<DeviceGroupDTO[]> {
    return this.deviceGroupService.getAll();
  }

  @Get('/:id')
  @ApiOkResponse({
    type: DeviceGroupDTO,
    description: 'Returns a Device group',
  })
  @ApiNotFoundResponse({ description: `No device group found` })
  async get(
    @Param('id') id: number,
    @UserDecorator() { organizationId }: ILoggedInUser,
  ): Promise<DeviceGroupDTO | null> {
    return this.deviceGroupService.findById(id, organizationId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.Buyer, Role.Admin)
  @ApiResponse({
    status: HttpStatus.OK,
    type: DeviceGroupDTO,
    description: 'Returns a new created Device group',
  })
  public async create(
    @UserDecorator() { organizationId }: ILoggedInUser,
    @Body() deviceGroupToRegister: NewDeviceGroupDTO,
  ): Promise<DeviceGroupDTO | null> {
    return await this.deviceGroupService.create(
      organizationId,
      deviceGroupToRegister,
    );
  }

  @Post('/add/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.Buyer, Role.Admin)
  @ApiResponse({
    status: HttpStatus.OK,
    type: DeviceGroupDTO,
    description: 'Returns a new created Device group',
  })
  public async addDevices(
    @Param('id') id: number,
    @UserDecorator() { organizationId }: ILoggedInUser,
    @Body() deviceIds: DeviceIdsDTO,
  ): Promise<DeviceGroupDTO | void> {
    return await this.deviceGroupService.addDevices(
      id,
      organizationId,
      deviceIds,
    );
  }

  @Post('/remove/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.Buyer, Role.Admin)
  @ApiResponse({
    status: HttpStatus.OK,
    type: DeviceGroupDTO,
    description: 'Returns a new created Device group',
  })
  public async removeDevices(
    @Param('id') id: number,
    @UserDecorator() { organizationId }: ILoggedInUser,
    @Body() deviceIds: DeviceIdsDTO,
  ): Promise<DeviceGroupDTO | void> {
    return await this.deviceGroupService.removeDevices(
      id,
      organizationId,
      deviceIds,
    );
  }

  @Patch('/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.Buyer, Role.Admin)
  @ApiResponse({
    status: HttpStatus.OK,
    type: UpdateDeviceGroupDTO,
    description: 'Returns an updated Device Group',
  })
  @ApiNotFoundResponse({ description: `No device group found` })
  public async update(
    @Param('id') id: number,
    @UserDecorator() { organizationId }: ILoggedInUser,
    @Body() groupToUpdate: UpdateDeviceGroupDTO,
  ): Promise<DeviceGroupDTO> {
    return await this.deviceGroupService.update(
      id,
      organizationId,
      groupToUpdate,
    );
  }

  @Delete('/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.Buyer, Role.Admin)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Remove device group',
  })
  @ApiNotFoundResponse({ description: `No device group found` })
  public async remove(
    @Param('id') id: number,
    @UserDecorator() { organizationId }: ILoggedInUser,
  ): Promise<void> {
    return await this.deviceGroupService.remove(id, organizationId);
  }
}

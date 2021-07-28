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
import { DeviceGroupDTO, NewDeviceGroupDTO, UpdateDeviceGroupDTO } from './dto';
import { Roles } from '../user/decorators/roles.decorator';
import { Role } from '../../utils/eums';
import { RolesGuard } from '../../auth/roles-guard';
import { UserDecorator } from '../user/decorators/user.decorator';
import { OrganizationUserDTO } from '../../auth/dto/org-user.dto';

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
  @ApiNotFoundResponse({
    description: `The device with the id doesn't exist`,
  })
  async get(@Param('id') id: number): Promise<DeviceGroupDTO | null> {
    return this.deviceGroupService.findById(id);
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
    @UserDecorator() user: OrganizationUserDTO,
    @Body() deviceGroupToRegister: NewDeviceGroupDTO,
  ) {
    return await this.deviceGroupService.create(
      user.organization.code,
      deviceGroupToRegister,
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
  @ApiNotFoundResponse({ description: `No device found` })
  public async update(
    @Param('id') id: number,
    @Body() groupToUpdate: UpdateDeviceGroupDTO,
  ) {
    return await this.deviceGroupService.update(id, groupToUpdate);
  }

  @Delete('/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.Buyer, Role.Admin)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Remove device group',
  })
  public async remove(@Param('id') id: number): Promise<void> {
    return await this.deviceGroupService.remove(id);
  }
}

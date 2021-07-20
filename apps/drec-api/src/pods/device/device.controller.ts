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

import { DeviceDTO } from './dto/device.dto';
import { DeviceService } from './device.service';
import { FilterDTO, NewDeviceDTO, UpdateDeviceDTO } from './dto';
import { Roles } from '../user/decorators/roles.decorator';
import { Role } from '../../utils/eums';
import { RolesGuard } from '../../auth/roles-guard';
import { UpdateOrganizationDTO } from '../organization/dto';
import { UserDecorator } from '../user/decorators/user.decorator';
import { OrganizationUserDTO } from '../../auth/dto/org-user.dto';

@ApiTags('device')
@ApiBearerAuth('access-token')
@ApiSecurity('drec')
@Controller('/device')
@UseGuards(AuthGuard('jwt'))
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @Get()
  @ApiOkResponse({ type: [DeviceDTO], description: 'Returns all Devices' })
  async getAll(
    @Query(ValidationPipe) filterDto: FilterDTO,
  ): Promise<DeviceDTO[]> {
    return this.deviceService.find(filterDto);
  }

  @Get('/:id')
  @ApiOkResponse({ type: DeviceDTO, description: 'Returns a Device' })
  @ApiNotFoundResponse({
    description: `The device with the code doesn't exist`,
  })
  async get(@Param('id') id: number): Promise<DeviceDTO | null> {
    return this.deviceService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.DeviceOwner)
  @ApiResponse({
    status: HttpStatus.OK,
    type: NewDeviceDTO,
    description: 'Returns a new created Device id',
  })
  public async create(
    @UserDecorator() user: OrganizationUserDTO,
    @Body() deviceToRegister: NewDeviceDTO,
  ) {
    return await this.deviceService.register(
      user.organization.code,
      deviceToRegister,
    );
  }

  @Patch('/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.DeviceOwner)
  @ApiResponse({
    status: HttpStatus.OK,
    type: UpdateOrganizationDTO,
    description: 'Returns an updated Device',
  })
  @ApiNotFoundResponse({ description: `No device found` })
  public async update(
    @UserDecorator() user: OrganizationUserDTO,
    @Param('id') id: number,
    @Body() organizationToUpdate: UpdateDeviceDTO,
  ) {
    return await this.deviceService.update(
      user.organization.code,
      id,
      organizationToUpdate,
    );
  }
}

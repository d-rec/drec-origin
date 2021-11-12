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
  Query,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiResponse,
  ApiOkResponse,
  ApiSecurity,
  ApiTags,
  ApiBody,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { DeviceGroupService } from './device-group.service';
import {
  AddGroupDTO,
  DeviceGroupDTO,
  DeviceIdsDTO,
  SelectableDeviceGroupDTO,
  UnreservedDeviceGroupsFilterDTO,
  UpdateDeviceGroupDTO,
  ReserveGroupsDTO,
} from './dto';
import { Roles } from '../user/decorators/roles.decorator';
import { Role } from '../../utils/enums';
import { RolesGuard } from '../../guards/RolesGuard';
import { UserDecorator } from '../user/decorators/user.decorator';
import { ILoggedInUser } from '../../models';
import { NewDeviceDTO } from '../device/dto';

@ApiTags('device-group')
@ApiBearerAuth('access-token')
@ApiSecurity('drec')
@Controller('/device-group')
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

  @Get('/unreserved')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Admin, Role.Buyer)
  @ApiOkResponse({
    type: [SelectableDeviceGroupDTO],
    description: 'Returns all unreserved Device Groups',
  })
  async getUnreserved(
    @Query(ValidationPipe) filterDto: UnreservedDeviceGroupsFilterDTO,
  ): Promise<SelectableDeviceGroupDTO[]> {
    return this.deviceGroupService.getReservedOrUnreserved(filterDto, false);
  }

  @Get('/reserved')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Admin, Role.Buyer)
  @ApiOkResponse({
    type: [SelectableDeviceGroupDTO],
    description: 'Returns all reserved Device Groups',
  })
  async getReserved(
    @UserDecorator() { id }: ILoggedInUser,
    @Query(ValidationPipe) filterDto: UnreservedDeviceGroupsFilterDTO,
  ): Promise<SelectableDeviceGroupDTO[]> {
    return this.deviceGroupService.getReservedOrUnreserved(filterDto, true, id);
  }

  @Get('/my')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.OrganizationAdmin, Role.DeviceOwner, Role.OrganizationUser)
  @ApiResponse({
    status: HttpStatus.OK,
    type: [DeviceGroupDTO],
    description: 'Returns my Device groups',
  })
  async getMyDevices(
    @UserDecorator() { organizationId }: ILoggedInUser,
  ): Promise<DeviceGroupDTO[]> {
    return await this.deviceGroupService.getOrganizationDeviceGroups(
      organizationId,
    );
  }

  @Get('/:id')
  @ApiOkResponse({
    type: DeviceGroupDTO,
    description: 'Returns a Device group',
  })
  @ApiNotFoundResponse({ description: `No device group found` })
  async get(@Param('id') id: number): Promise<DeviceGroupDTO | null> {
    return this.deviceGroupService.findById(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.DeviceOwner, Role.Admin)
  @ApiResponse({
    status: HttpStatus.OK,
    type: DeviceGroupDTO,
    description: 'Returns a new created Device group',
  })
  public async createOne(
    @UserDecorator() { organizationId }: ILoggedInUser,
    @Body() deviceGroupToRegister: AddGroupDTO,
  ): Promise<DeviceGroupDTO | null> {
    return await this.deviceGroupService.createOne(
      organizationId,
      deviceGroupToRegister,
    );
  }

  @Post('/reserve')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Buyer)
  @ApiResponse({
    status: HttpStatus.OK,
    type: [DeviceGroupDTO],
    description: 'Returns a new created Device group',
  })
  public async reserve(
    @UserDecorator()
    { id, blockchainAccountAddress }: ILoggedInUser,
    @Body() ids: ReserveGroupsDTO,
  ): Promise<DeviceGroupDTO[]> {
    return await this.deviceGroupService.reserveGroup(
      ids,
      id,
      blockchainAccountAddress,
    );
  }

  @Post('/unreserve')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Buyer)
  @ApiResponse({
    status: HttpStatus.OK,
    type: [DeviceGroupDTO],
    description: 'Unreserves device groups from buyer',
  })
  public async unreserve(
    @UserDecorator()
    { id }: ILoggedInUser,
    @Body() ids: ReserveGroupsDTO,
  ): Promise<DeviceGroupDTO[]> {
    return await this.deviceGroupService.unreserveGroup(ids, id);
  }

  @Post('multiple')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.DeviceOwner, Role.Admin)
  @ApiResponse({
    status: HttpStatus.OK,
    type: [DeviceGroupDTO],
    description: 'Returns a new created Device group',
  })
  @ApiBody({ type: [AddGroupDTO] })
  public async createMultiple(
    @UserDecorator() { organizationId }: ILoggedInUser,
    @Body() deviceGroupsToRegister: AddGroupDTO[],
  ): Promise<DeviceGroupDTO[]> {
    return await this.deviceGroupService.createMultiple(
      organizationId,
      deviceGroupsToRegister,
    );
  }

  @Post('bulk-devices')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Admin, Role.DeviceOwner)
  @ApiResponse({
    status: HttpStatus.OK,
    type: [DeviceGroupDTO],
    description: 'Returns auto-created device groups',
  })
  @ApiBody({ type: [NewDeviceDTO] })
  public async createBulk(
    @UserDecorator() { organizationId }: ILoggedInUser,
    @Body() devicesToRegister: NewDeviceDTO[],
  ): Promise<DeviceGroupDTO[]> {
    return await this.deviceGroupService.registerBulkDevices(
      organizationId,
      devicesToRegister,
    );
  }

  @Post('/add/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Admin)
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
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Admin)
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
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.DeviceOwner, Role.Admin)
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
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.DeviceOwner, Role.Admin)
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

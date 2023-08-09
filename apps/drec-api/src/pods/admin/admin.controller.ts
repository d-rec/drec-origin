import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Put,
  Query,
  UseGuards,
  ValidationPipe,
  UseInterceptors,
  Delete,
  NotFoundException,
  Patch,
  Post,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiBody,
  ApiNotFoundResponse,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import {
  NullOrUndefinedResultInterceptor,
  SuccessResponseDTO,
} from '@energyweb/origin-backend-utils';
import { UpdateUserDTO } from './dto/update-user.dto';
import { UserDTO } from '../user/dto/user.dto';
import { Observable } from 'rxjs';
import { UserService } from '../user/user.service';
import { ActiveUserGuard, RolesGuard } from '../../guards';
import { OrganizationService } from '../organization/organization.service';
import { Role } from '../../utils/enums';
import { Roles } from '../user/decorators/roles.decorator';
import { UserFilterDTO } from './dto/user-filter.dto';
import { OrganizationDTO, UpdateOrganizationDTO } from '../organization/dto';
import { ResponseSuccess } from '../../models';
// import { CreateUserDTO } from '../user/dto/create-user.dto';
import { CreateUserORGDTO } from '../user/dto/create-user.dto';
import { SeedUserDTO } from './dto/seed-user.dto';
import { DeviceService } from '../device/device.service'
import { DeviceGroupService } from '../device-group/device-group.service'
@ApiTags('admin')
@ApiBearerAuth('access-token')
@Controller('admin')
@UseGuards(AuthGuard('jwt'), ActiveUserGuard, RolesGuard)
@UseInterceptors(NullOrUndefinedResultInterceptor)
export class AdminController {
  constructor(
    private readonly userService: UserService,
    private readonly organizationService: OrganizationService,
    private readonly deviceService: DeviceService,
    private readonly devicegroupService: DeviceGroupService,
  ) { }

  @Get('/users')
  @Roles(Role.Admin)
  @ApiResponse({
    status: HttpStatus.OK,
    type: [UserDTO],
    description: 'Gets all users',
  })
  public async getUsers(
    @Query(ValidationPipe) filterDto: UserFilterDTO,
  ): Promise<UserDTO[]> {
    return this.userService.getUsersByFilter(filterDto);
  }

  @Get('/organizations')
  @Roles(Role.Admin)
  @ApiResponse({
    type: [OrganizationDTO],
    description: 'Returns all Organizations',
  })
  async getAllOrganizations(): Promise<OrganizationDTO[]> {
    return await this.organizationService.getAll();
  }

  @Get('/organizations/:id')
  @Roles(Role.Admin)
  @ApiResponse({
    status: HttpStatus.OK,
    type: OrganizationDTO,
    description: 'Gets an organization',
  })
  @ApiNotFoundResponse({
    description: `The organization with the id doesn't exist`,
  })
  async getOrganizationById(
    @Param('id', new ParseIntPipe()) organizationId: number,
  ): Promise<OrganizationDTO | undefined> {
    return this.organizationService.findOne(organizationId);
  }

  @Post('/users')
  @Roles(Role.Admin)
  @ApiResponse({
    status: HttpStatus.OK,
    // type: CreateUserDTO,
    type: CreateUserORGDTO,
    description: 'Returns a new created user',
  })
  public async createUser(@Body() newUser: CreateUserORGDTO): Promise<UserDTO> {
    return await this.userService.newcreate(newUser);
  }

  @Post('/seed/users')
  @Roles(Role.Admin)
  @ApiResponse({
    status: HttpStatus.OK,
    type: [UserDTO],
    description: 'Returns new created users',
  })
  public async seedUsers(@Body() newUsers: SeedUserDTO[]): Promise<UserDTO[]> {
    const users: UserDTO[] = [];
    if (!newUsers || !newUsers.length) {
      return users;
    }
    await Promise.all(
      newUsers.map(async (newUser: SeedUserDTO) => {
        const createdUser = await this.userService.seed(
          newUser,
          newUser.organizationId,
          newUser.role,
          newUser.status,
        );
        users.push(createdUser);
      }),
    );
    return users;
  }

  @Post('/seed/organizations')
  @Roles(Role.Admin)
  @ApiResponse({
    status: HttpStatus.OK,
    type: [OrganizationDTO],
    description: 'Returns new created users',
  })
  public async seedOrgs(
    @Body() newOrgs: OrganizationDTO[],
  ): Promise<OrganizationDTO[]> {
    const orgs: OrganizationDTO[] = [];
    if (!newOrgs || !newOrgs.length) {
      return orgs;
    }
    await Promise.all(
      newOrgs.map(async (newOrg: OrganizationDTO) => {
        const createdOrg = await this.organizationService.seed(newOrg);
        orgs.push(createdOrg);
      }),
    );
    return orgs;
  }

  @Put('/users/:id')
  @Roles(Role.Admin)
  @ApiBody({ type: UpdateUserDTO })
  @ApiResponse({
    status: HttpStatus.OK,
    type: UserDTO,
    description: 'Updates a user (admin)',
  })
  public async updateUser(
    @Param('id', new ParseIntPipe()) id: number,
    @Body() body: UpdateUserDTO,
  ): Promise<UserDTO> {
    return this.userService.update(id, body);
  }

  @Patch('/organizations/:id')
  @Roles(Role.Admin)
  @ApiResponse({
    status: HttpStatus.OK,
    type: UpdateOrganizationDTO,
    description: 'Returns an updated Organization',
  })
  @ApiNotFoundResponse({ description: `No organization found` })
  public async updateOrganization(
    @Param('id') organizationId: number,
    @Body() organizationToUpdate: UpdateOrganizationDTO,
  ): Promise<OrganizationDTO> {
    return await this.organizationService.update(
      organizationId,
      organizationToUpdate,
    );
  }

  @Delete('/organizations/:id')
  @Roles(Role.Admin)
  @ApiResponse({
    status: HttpStatus.OK,
    type: SuccessResponseDTO,
    description: 'Delete an organization',
  })
  async deleteOrganization(
    @Param('id', new ParseIntPipe()) organizationId: number,
  ): Promise<SuccessResponseDTO> {
    const organization = await this.organizationService.findOne(organizationId);

    if (!organization) {
      throw new NotFoundException('Does not exist');
    }

    await this.organizationService.remove(organizationId);

    return ResponseSuccess();
  }

  @Delete('/user/:id')
  @Roles(Role.Admin)
  @ApiResponse({
    status: HttpStatus.OK,
    type: SuccessResponseDTO,
    description: 'Delete an organization',
  })
  async deleteUser(
    @Param('id', new ParseIntPipe()) userid: number,
  ): Promise<SuccessResponseDTO> {

    const user = await this.userService.findById(userid);

    if (!user) {
      throw new NotFoundException('Does not exist');
    }
    if (user.role === Role.Buyer) {
      const buyerresrvation = this.devicegroupService.findOne({organizationId:user.organization.id})
      if (buyerresrvation) {
        throw new NotFoundException('This User is part of resvation,So you cannot Remove');
        
      }

    } else if (user.role === Role.OrganizationAdmin) {
      const deviceoforg = this.deviceService.getatleastonedeviceinOrg(user.organization.id)
      if (deviceoforg) {
        throw new NotFoundException('This User is part of resvation,So you cannot Remove');
      }
    }

    await this.userService.remove(user.id);

    return ResponseSuccess();
  }
  // api for device registration into I-REC
  @Post('/add/device-into-Irec/:id')
  @Roles(Role.Admin)
  @ApiResponse({
    status: HttpStatus.OK,
    // type: CreateUserDTO,
    // type: CreateUserORGDTO,
    description: 'Returns a new created device in I-REC',
  })
  public async IrecdeviceRegister(
    @Param('id') id: number,
    // @Body() irecDevice: {deviceid:number}
  ): Promise<any> {
    return await this.deviceService.I_recPostData(id);
  }

}

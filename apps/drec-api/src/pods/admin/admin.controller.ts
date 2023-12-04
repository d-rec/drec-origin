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
  DefaultValuePipe
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiBody,
  ApiNotFoundResponse,
  ApiResponse,
  ApiTags,
  ApiQuery
} from '@nestjs/swagger';

import {
  NullOrUndefinedResultInterceptor,
  SuccessResponseDTO,
} from '@energyweb/origin-backend-utils';
import { UpdateUserDTO } from './dto/update-user.dto';
import { UserDTO } from '../user/dto/user.dto';
import { Observable } from 'rxjs';
import { UserService } from '../user/user.service';
import { ActiveUserGuard, PermissionGuard, RolesGuard } from '../../guards';
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
import { Permission } from '../permission/decorators/permission.decorator';
import { ACLModules } from '../access-control-layer-module-service/decorator/aclModule.decorator';
import { OrganizationFilterDTO } from './dto/organization-filter.dto'

/*
* It is Controller of admin with the endpoints of admin operations.
*/
@ApiTags('admin')
@ApiBearerAuth('access-token')
@Controller('admin')
@UseGuards(AuthGuard('jwt'), ActiveUserGuard, RolesGuard, PermissionGuard)
@UseInterceptors(NullOrUndefinedResultInterceptor)
export class AdminController {
  constructor(
    private readonly userService: UserService,
    private readonly organizationService: OrganizationService,
    private readonly deviceService: DeviceService,
    private readonly devicegroupService: DeviceGroupService,
  ) { }
  
  /*
  *It is Get Api to get the list all the users with filters and pagination.
  */
  @Get('/users')
  @UseGuards(AuthGuard('jwt'), AuthGuard('oauth2-client-password'), PermissionGuard)
  // @Roles(Role.Admin)
  @Permission('Read')
  @ACLModules('ADMIN_APIUSER_ORGANIZATION_CRUDL')
  @ApiQuery({ name: 'pageNumber', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [UserDTO],
    description: 'Gets all users',
  })
  public async getUsers(
    @Query(ValidationPipe) filterDto: UserFilterDTO,
    @Query('pageNumber', new DefaultValuePipe(1), ParseIntPipe) pageNumber: number,
    @Query('limit', new DefaultValuePipe(0), ParseIntPipe) limit: number,
  )/*: Promise<UserDTO[]>*/ {
    return this.userService.getUsersByFilter(filterDto, pageNumber, limit);
  }

  /*
  * It is GET api to list all organizations with pagination and filters
  */
  @Get('/organizations')
  @Roles(Role.Admin)
  @Permission('Read')
  @ACLModules('ADMIN_MANAGEMENT_CRUDL')
  @ApiQuery({ name: 'pageNumber', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiResponse({
    type: [OrganizationDTO],
    description: 'Returns all Organizations',
  })
  async getAllOrganizations(
    @Query(ValidationPipe) filterDto: OrganizationFilterDTO,
    @Query('pageNumber', new DefaultValuePipe(1), ParseIntPipe) pageNumber: number,
    @Query('limit', new DefaultValuePipe(0), ParseIntPipe) limit: number,
  )/*: Promise<OrganizationDTO[]>*/ {
    return await this.organizationService.getAll(filterDto, pageNumber, limit);
  }

  /**
  * It is GET api to list all users of an organization with pagination
  * @param {orhanizationId} is type of number which is the identifier of an organization
  */
  @Get('/organizations/user/:organizationId')
  // @Roles(Role.Admin)
  @UseGuards(AuthGuard('jwt'), AuthGuard('oauth2-client-password'), PermissionGuard)
  @Permission('Read')
  @ACLModules("ADMIN_APIUSER_ORGANIZATION_CRUDL")
  @ApiQuery({ name: 'pageNumber', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiResponse({
    type: [OrganizationDTO],
    description: 'Returns all User Of Organizations',
  })
  async getAllUserOrganizations(
    @Param('organizationId', new ParseIntPipe()) organizationId: number,
    @Query('pageNumber', new DefaultValuePipe(1), ParseIntPipe) pageNumber: number,
    @Query('limit', new DefaultValuePipe(0), ParseIntPipe) limit: number,
  )/*:  Promise<UserDTO[]>*/ {
    return this.organizationService.findOrganizationUsers(organizationId, pageNumber, limit);
  }

  /**
  * It is GET api to fetch an organization renord.
  * @param {orhanizationId} is type of number which is the identifier of an organization
  * @return { OrganizationDTO | undefined } OrganizationDto is for success response 
  * and undefined when there is no particular record not available.
  */
  @Get('/organizations/:id')
  @Roles(Role.Admin)
  @Permission('Read')
  @ACLModules("ADMIN_MANAGEMENT-CRUDL")
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

  /*
  * It is POST api to create organization(Developer And Buyer) from admin.
  */
  @Post('/users')
  @Roles(Role.Admin)
  @Permission('Write')
  @ACLModules('ADMIN_MANAGEMENT_CRUDL')
  @ApiResponse({
    status: HttpStatus.OK,
    // type: CreateUserDTO,
    type: CreateUserORGDTO,
    description: 'Returns a new created user',
  })
  public async createUser(@Body() newUser: CreateUserORGDTO): Promise<UserDTO> {
    return await this.userService.adminnewcreate(newUser);
  }
  /**
   * It is api used in previous versions of drec to create user at admin end
   * @param newUsers 
   * @returns 
   */
  @Post('/seed/users'
  )
  @Roles(Role.Admin)
  @Permission('Write')
  @ACLModules('ADMIN_MANAGEMENT_CRUDL')
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
  @Permission('Write')
  @ACLModules('ADMIN_MANAGEMENT_CRUDL')
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

  /*
  * It is PUT api to update an user.
  * @return {UserDto} returns an updated user.
  * @param {id} is the type of number which is the identifier of user.
  */
  @Put('/users/:id')
  @Roles(Role.Admin)
  @Permission('Write')
  @ACLModules('ADMIN_MANAGEMENT_CRUDL')
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

  /*
  * It is PATCH api to update an organization
  * @return {OrganizationDto} returns the updated organization.
  * @param { id } is the type of number which is the identifier of an organization.
  */
  @Patch('/organizations/:id')
  @Roles(Role.Admin)
  @Permission('Update')
  @ACLModules('ADMIN_MANAGEMENT_CRUDL')
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

  /*
  * It is DELETE api to delete an organization.
  * @return {SuccessResponseDto} returns an message for success or failure response.
  * @param {id} is the type of number which is identifier of an organization.
  */
  @Delete('/organizations/:id')
  @Roles(Role.Admin)
  @Permission('Delete')
  @ACLModules('ADMIN_MANAGEMENT_CRUDL')
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

  /*
  * It is DELETE api to delete an user.
  * @return {SuccessResponseDto} returns an message for success or failure response.
  * @param {id} is the type of number which is identifier of an user.
  */ 
  @Delete('/user/:id')
  @Roles(Role.Admin)
  @Permission('Delete')
  @ACLModules('ADMIN_MANAGEMENT_CRUDL')
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
    const manyotheruserinorg = await this.userService.getatleastoneotheruserinOrg(user.organization.id, user.id)
   
    if (user.role === Role.Buyer || user.role === Role.OrganizationAdmin) {
      const buyerresrvation = await this.devicegroupService.findOne({ organizationId: user.organization.id })
     
      if (buyerresrvation) {
        throw new NotFoundException('This user is part of reservation,So you cannot remove this user and organization');

      }
      const deviceoforg = await this.deviceService.getatleastonedeviceinOrg(user.organization.id)
     
      if (deviceoforg.length > 0) {
        throw new NotFoundException('Some device are available in organization ');
      }
      // if (manyotheruserinorg) {
      //   throw new NotFoundException('Some more users availble in organization. So user cannot remove');
      // }
      if (!(manyotheruserinorg.length>0)) {
        // throw new NotFoundException('Some more users availble in organization. So user cannot remove');
        await this.userService.remove(user.id);
        await this.organizationService.remove(user.organization.id);
     }

   }
   else {
     await this.userService.remove(user.id);
   }

    return ResponseSuccess();
  }

  /*
  * It is POST api to create or register device into I-REC
  * @return {any} returns message for sucessful / failure response.
  * @param { id } is the type of number and identifier of an device.
  */
  // api for device registration into I-REC
  @Post('/add/device-into-Irec/:id')
  @Roles(Role.Admin)
  @Permission('Write')
  @ACLModules('ADMIN_MANAGEMENT_CRUDL')
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

  /*
  * It is GET api to list all devices by an organization and device's externalId
  */
  @Get('/devices/autocomplete')
  @Roles(Role.Admin)
  @Permission('Read')
  @ACLModules('ADMIN_MANAGEMENT_CRUDL')
  //@Roles(Role.OrganizationAdmin, Role.DeviceOwner)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns Auto-Complete',
  })

  @ApiQuery({ name: 'externalId', description: 'externalId', type: String })

  async autocomplete(
    // @UserDecorator() { organizationId }: ILoggedInUser,
    @Query('externalId') externalId: String,
    @Query('organizationId') organizationId: number,
  ) {
    //@ts-ignore
    console.log("adminaddorgId", organizationId)
    // if (adminaddorgId != null || adminaddorgId != undefined) {
    //   organizationId = adminaddorgId;
    // }
    return await this.deviceService.atto(organizationId, externalId);
  }

  /*
  * It is GET api to list all ApiUsers with pagination and filteration by Organization.
  */
  @Get('/apiusers')
  @Roles(Role.Admin)
  @Permission('Read')
  @ACLModules('ADMIN_MANAGEMENT_CRUDL')
  @ApiQuery({ name: 'pageNumber', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiQuery({ name: 'organizationName', type: String, required: false})
  @ApiResponse({
    status: HttpStatus.OK,
    type: [UserDTO],
    description: 'Gets all apiusers',
  })
  public async getApiUsers(
    @Query('organizationName',new DefaultValuePipe(null)) organizationName: string | null,
    @Query('pageNumber', new DefaultValuePipe(1), ParseIntPipe) pageNumber: number,
    @Query('limit', new DefaultValuePipe(0), ParseIntPipe) limit: number,
  ) {
    console.log("With in getAllApiUsers",organizationName);
    return this.userService.getApiUsers(organizationName,pageNumber, limit);
  }

}

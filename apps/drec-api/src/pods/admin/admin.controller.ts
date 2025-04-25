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
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiNotFoundResponse,
  ApiResponse,
  ApiTags,
  ApiQuery,
  ApiOperation,
} from '@nestjs/swagger';

import {
  NullOrUndefinedResultInterceptor,
  SuccessResponseDTO,
} from '@energyweb/origin-backend-utils';
import { UpdateUserDTO } from './dto/update-user.dto';
import { UserDTO } from '../user/dto/user.dto';
import { UserService } from '../user/user.service';
import {
  ActiveUserGuard,
  AuthVerifiedGuard,
  PermissionGuard,
  RolesGuard,
} from '../../guards';
import { OrganizationService } from '../organization/organization.service';
import { Role } from '../../utils/enums';
import { Roles } from '../user/decorators/roles.decorator';
import { UserFilterDTO } from './dto/user-filter.dto';
import { OrganizationDTO, UpdateOrganizationDTO } from '../organization/dto';
import { IUser, LoggedInUser, responseSuccess } from '../../models';
// import { CreateUserDTO } from '../user/dto/create-user.dto';
import { CreateUserOrgDTO } from '../user/dto/create-user.dto';
import { SeedUserDTO } from './dto/seed-user.dto';
import { DeviceService } from '../device/device.service';
import { DeviceGroupService } from '../device-group/device-group.service';
import { Permission } from '../permission/decorators/permission.decorator';
import { ACLModules } from '../access-control-layer-module-service/decorator/aclModule.decorator';
import { OrganizationFilterDTO } from './dto/organization-filter.dto';
import { InvitationService } from '../invitation/invitation.service';
import { UserDecorator } from '../user/decorators/user.decorator';
import { Organization } from '../organization/organization.entity';
@ApiTags('Admin')
@ApiBearerAuth('access-token')
@Controller('admin')
@UseGuards(
  AuthVerifiedGuard('jwt'),
  ActiveUserGuard,
  RolesGuard,
  PermissionGuard,
)
@UseInterceptors(NullOrUndefinedResultInterceptor)
export class AdminController {
  constructor(
    private readonly userService: UserService,
    private readonly organizationService: OrganizationService,
    private readonly deviceService: DeviceService,
    private readonly deviceGroupService: DeviceGroupService,
    private readonly invitationService: InvitationService,
  ) {}

  @Get('/users')
  @Roles(Role.Admin)
  @Permission('Read')
  @ACLModules('ADMIN_MANAGEMENT_CRUDL')
  @ApiQuery({ name: 'pageNumber', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiOperation({
    summary: 'Get all users',
    description:
      'Returns a paginated list of all users, optionally filtered by query parameters.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [UserDTO],
    description: 'Successfully retrieved the list of users.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden. User does not have the required permissions.',
  })
  public async getUsers(
    @Query(ValidationPipe) filterDTO: UserFilterDTO,
    @Query('pageNumber', new DefaultValuePipe(1), ParseIntPipe)
    pageNumber: number,
    @Query('limit', new DefaultValuePipe(0), ParseIntPipe) limit: number,
  ): Promise<{
    users: IUser[];
    currentPage: number;
    totalPages: number;
    totalCount: number;
  }> {
    return this.userService.getUsersByFilter(filterDTO, pageNumber, limit);
  }

  @Get('/organizations')
  @UseGuards(
    AuthVerifiedGuard('jwt'),
    ActiveUserGuard,
    RolesGuard,
    PermissionGuard,
  )
  @Roles(Role.Admin)
  @Permission('Read')
  @ACLModules('ADMIN_MANAGEMENT_CRUDL')
  @ApiQuery({ name: 'pageNumber', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiOperation({
    summary: 'Get all organizations',
    description:
      'Returns a paginated list of all organizations, optionally filtered by query parameters.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [OrganizationDTO],
    description: 'Successfully retrieved the list of organizations.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden. User does not have the required permissions.',
  })
  async getAllOrganizations(
    @Query(ValidationPipe) filterDTO: OrganizationFilterDTO,
    @Query('pageNumber', new DefaultValuePipe(1), ParseIntPipe)
    pageNumber: number,
    @Query('limit', new DefaultValuePipe(0), ParseIntPipe) limit: number,
    @UserDecorator() user: LoggedInUser,
  ): Promise<{
    organizations: Organization[];
    currentPage: number;
    totalPages: number;
    totalCount: number;
  }> {
    return await this.organizationService.getAll(
      filterDTO,
      pageNumber,
      limit,
      user,
    );
  }
  @Get('/organizations/user/:organizationId')
  @Permission('Read')
  @ACLModules('ADMIN_APIUSER_ORGANIZATION_CRUDL')
  @ApiQuery({ name: 'pageNumber', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiOperation({
    summary: 'Get all users of an organization',
    description:
      'Returns a paginated list of users belonging to the specified organization.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [OrganizationDTO],
    description:
      'Successfully retrieved the list of users for the organization.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden. User does not have the required permissions.',
  })
  async getAllUserOrganizations(
    @Param('organizationId', new ParseIntPipe()) organizationId: number,
    @Query('pageNumber', new DefaultValuePipe(1), ParseIntPipe)
    pageNumber: number,
    @Query('limit', new DefaultValuePipe(0), ParseIntPipe) limit: number,
  ): Promise<{
    users: IUser[];
    currentPage: number;
    totalPages: number;
    totalCount: number;
  }> {
    return this.organizationService.findOrganizationUsers(
      organizationId,
      pageNumber,
      limit,
    );
  }
  @Get('/organizations/:id')
  @UseGuards(
    AuthVerifiedGuard('jwt'),
    ActiveUserGuard,
    RolesGuard,
    PermissionGuard,
  )
  @Roles(Role.Admin)
  @Permission('Read')
  @ACLModules('ADMIN_MANAGEMENT-CRUDL')
  @ApiOperation({
    summary: 'Get organization by ID',
    description:
      'Returns the details of the organization with the specified ID.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: OrganizationDTO,
    description: 'Successfully retrieved the organization details.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The organization with the specified ID does not exist.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden. User does not have the required permissions.',
  })
  async getOrganizationById(
    @Param('id', new ParseIntPipe()) organizationId: number,
  ): Promise<OrganizationDTO | undefined> {
    return this.organizationService.findOne(organizationId);
  }

  @Post('/users')
  @UseGuards(
    AuthVerifiedGuard('jwt'),
    ActiveUserGuard,
    RolesGuard,
    PermissionGuard,
  )
  @Roles(Role.Admin)
  @Permission('Write')
  @ACLModules('ADMIN_MANAGEMENT_CRUDL')
  @ApiOperation({
    summary: 'Create a new user',
    description: 'Creates a new user with the provided details.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: CreateUserOrgDTO,
    description: 'Successfully created a new user.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid data provided for creating the user.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden. User does not have the required permissions.',
  })
  public async createUser(
    @Body() newUser: CreateUserOrgDTO,
    @UserDecorator() { api_user_id }: LoggedInUser,
  ): Promise<UserDTO> {
    newUser.api_user_id = api_user_id;
    return await this.userService.createUserByAdmin(newUser);
  }

  @Post('/seed/users')
  @UseGuards(
    AuthVerifiedGuard('jwt'),
    ActiveUserGuard,
    RolesGuard,
    PermissionGuard,
  )
  @Roles(Role.Admin)
  @Permission('Write')
  @ACLModules('ADMIN_MANAGEMENT_CRUDL')
  @ApiOperation({
    summary: 'Seed users',
    description: 'Creates multiple users with the provided seed data.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: [UserDTO],
    description: 'Successfully created the seeded users.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid data provided for seeding users.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden. User does not have the required permissions.',
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
  @UseGuards(
    AuthVerifiedGuard('jwt'),
    ActiveUserGuard,
    RolesGuard,
    PermissionGuard,
  )
  @Roles(Role.Admin)
  @Permission('Write')
  @ACLModules('ADMIN_MANAGEMENT_CRUDL')
  @ApiOperation({
    summary: 'Seed organizations',
    description: 'Creates multiple organizations with the provided seed data.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: [OrganizationDTO],
    description: 'Successfully created the seeded organizations.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid data provided for seeding organizations.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden. User does not have the required permissions.',
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
  @UseGuards(
    AuthVerifiedGuard('jwt'),
    ActiveUserGuard,
    RolesGuard,
    PermissionGuard,
  )
  @Roles(Role.Admin, Role.ApiUser)
  @Permission('Write')
  @ACLModules('ADMIN_APIUSER_ORGANIZATION_CRUDL')
  @ApiBody({ type: UpdateUserDTO })
  @ApiOperation({
    summary: 'Update a user',
    description: 'Updates the details of the user with the specified ID.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: UserDTO,
    description: 'Successfully updated the user.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid data provided for updating the user.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The user with the specified ID does not exist.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden. User does not have the required permissions.',
  })
  public async updateUser(
    @Param('id', new ParseIntPipe()) id: number,
    @Body() body: UpdateUserDTO,
  ): Promise<UserDTO> {
    return this.userService.update(id, body);
  }

  @Patch('/organizations/:id')
  @UseGuards(
    AuthVerifiedGuard('jwt'),
    ActiveUserGuard,
    RolesGuard,
    PermissionGuard,
  )
  @Roles(Role.Admin)
  @Permission('Update')
  @ACLModules('ADMIN_MANAGEMENT_CRUDL')
  @ApiOperation({
    summary: 'Update an organization',
    description:
      'Updates the details of the organization with the specified ID.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: UpdateOrganizationDTO,
    description: 'Successfully updated the organization.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The organization with the specified ID does not exist.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden. User does not have the required permissions.',
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
  @UseGuards(
    AuthVerifiedGuard('jwt'),
    ActiveUserGuard,
    RolesGuard,
    PermissionGuard,
  )
  @Roles(Role.Admin)
  @Permission('Delete')
  @ACLModules('ADMIN_MANAGEMENT_CRUDL')
  @ApiOperation({
    summary: 'Delete an organization',
    description: 'Deletes the organization with the specified ID.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SuccessResponseDTO,
    description: 'Successfully deleted the organization.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The organization with the specified ID does not exist.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden. User does not have the required permissions.',
  })
  async deleteOrganization(
    @Param('id', new ParseIntPipe()) organizationId: number,
  ): Promise<SuccessResponseDTO> {
    const organization = await this.organizationService.findOne(organizationId);

    if (!organization) {
      throw new NotFoundException('Does not exist');
    }

    await this.organizationService.remove(organizationId);

    return responseSuccess();
  }

  @Delete('/user/:id')
  @UseGuards(
    AuthVerifiedGuard('jwt'),
    ActiveUserGuard,
    RolesGuard,
    PermissionGuard,
  )
  @Roles(Role.Admin)
  @Permission('Delete')
  @ACLModules('ADMIN_MANAGEMENT_CRUDL')
  @ApiOperation({
    summary: 'Delete a user',
    description: 'Deletes the user with the specified ID.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SuccessResponseDTO,
    description: 'Successfully deleted the user.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The user with the specified ID does not exist.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden. User does not have the required permissions.',
  })
  async deleteUser(
    @Param('id', new ParseIntPipe()) userid: number,
  ): Promise<SuccessResponseDTO> {
    const user = await this.userService.findById(userid);

    if (!user) {
      throw new NotFoundException('Does not exist');
    }
    const otherOrgUsers = await this.userService.getAnotherUserInOrganization(
      user.organization.id,
      user.id,
    );

    if (user.role === Role.Buyer || user.role === Role.OrganizationAdmin) {
      const buyerReservation = await this.deviceGroupService.findOne({
        organizationId: user.organization.id,
      });

      if (buyerReservation) {
        throw new NotFoundException(
          'This user is part of reservation,So you cannot remove this user and organization',
        );
      }
      const deviceOfOrg =
        await this.deviceService.getLatestDeviceByOrganization(
          user.organization.id,
        );

      if (deviceOfOrg.length > 0) {
        throw new NotFoundException(
          'Some device are available in organization ',
        );
      }
      // if (manyotheruserinorg) {
      //   throw new NotFoundException('Some more users availble in organization. So user cannot remove');
      // }
      if (!(otherOrgUsers.length > 0)) {
        // throw new NotFoundException('Some more users availble in organization. So user cannot remove');
        await this.userService.remove(user.id);
        await this.organizationService.remove(user.organization.id);
      }
    } else {
      await this.invitationService.remove(user.email, user.organization.id);
      await this.userService.remove(user.id);
    }

    return responseSuccess();
  }
  // api for device registration into I-REC
  @Post('/add/device-into-Irec/:id')
  @UseGuards(
    AuthVerifiedGuard('jwt'),
    ActiveUserGuard,
    RolesGuard,
    PermissionGuard,
  )
  @Roles(Role.Admin)
  @Permission('Write')
  @ACLModules('ADMIN_MANAGEMENT_CRUDL')
  @ApiOperation({
    summary: 'Register a device in I-REC',
    description:
      'Registers a device with the specified ID in the I-REC system.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully registered the device in I-REC.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid device ID provided.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The device with the specified ID does not exist.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden. User does not have the required permissions.',
  })
  public async irecDeviceRegister(
    @Param('id') id: number,
    // @Body() irecDevice: {deviceid:number}
  ): Promise<any> {
    return await this.deviceService.irecPostData(id);
  }

  @Get('/devices/autocomplete')
  @UseGuards(
    AuthVerifiedGuard('jwt'),
    ActiveUserGuard,
    RolesGuard,
    PermissionGuard,
  )
  @Roles(Role.Admin)
  @Permission('Read')
  @ACLModules('ADMIN_MANAGEMENT_CRUDL')
  //@Roles(Role.OrganizationAdmin, Role.DeviceOwner)
  @ApiOperation({
    summary: 'Get device autocomplete suggestions',
    description:
      'Returns a list of device suggestions based on the provided external ID and organization ID.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved device autocomplete suggestions.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid external ID or organization ID provided.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden. User does not have the required permissions.',
  })
  @ApiQuery({ name: 'externalId', description: 'externalId', type: String })
  async autoComplete(
    // @UserDecorator() { organizationId }: ILoggedInUser,
    @Query('externalId') externalId: string,
    @Query('organizationId') organizationId: number,
  ): Promise<any[]> {
    return await this.deviceService.atto(organizationId, externalId);
  }

  /*
   * It is GET api to list all ApiUsers with pagination and filteration by Organization.
   */
  @Get('/apiusers')
  @UseGuards(
    AuthVerifiedGuard('jwt'),
    ActiveUserGuard,
    RolesGuard,
    PermissionGuard,
  )
  @Roles(Role.Admin)
  @Permission('Read')
  @ACLModules('ADMIN_MANAGEMENT_CRUDL')
  @ApiQuery({ name: 'pageNumber', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiQuery({ name: 'organizationName', type: String, required: false })
  @ApiOperation({
    summary: 'Get all API users',
    description:
      'Returns list of all API users, optionally filtered by organization name.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [UserDTO],
    description: 'Successfully retrieved the list of API users.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid query parameters provided.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden. User does not have the required permissions.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No API users found matching the criteria.',
  })
  public async getApiUsers(
    @Query('organizationName', new DefaultValuePipe(null))
    organizationName: string | null,
    @Query('pageNumber', new DefaultValuePipe(1), ParseIntPipe)
    pageNumber: number,
    @Query('limit', new DefaultValuePipe(0), ParseIntPipe) limit: number,
  ): Promise<{
    users: IUser[];
    currentPage: number;
    totalPages: number;
    totalCount: number;
  }> {
    // this.logger.verbose(`With in getAllApiUsers`);
    return this.userService.getApiUsers(organizationName, pageNumber, limit);
  }
}

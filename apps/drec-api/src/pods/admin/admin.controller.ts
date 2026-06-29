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
import { AuthVerifiedGuard, PermissionGuard, RolesGuard } from '../../guards';
import { OrganizationService } from '../organization/organization.service';
import { Role } from '../../utils/enums';
import { Roles } from '../user/decorators/roles.decorator';
import { UserFilterDTO } from './dto/user-filter.dto';
import { OrganizationDTO, UpdateOrganizationDTO } from '../organization/dto';
import { IUser, LoggedInUser, responseSuccess } from '../../models';
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
import { IssuerService } from '../issuer/services/issuer.service';
import { CertificateLogService } from '../certificate-log/certificate-log.service';
import { ReissueCertificateDTO } from './dto/reissue-certificate.dto';
import { DateTime } from 'luxon';
@ApiTags('Admin')
@ApiBearerAuth('access-token')
@Controller('admin')
@UseGuards(AuthVerifiedGuard('jwt'), RolesGuard, PermissionGuard)
@UseInterceptors(NullOrUndefinedResultInterceptor)
export class AdminController {
  constructor(
    private readonly userService: UserService,
    private readonly organizationService: OrganizationService,
    private readonly deviceService: DeviceService,
    private readonly deviceGroupService: DeviceGroupService,
    private readonly invitationService: InvitationService,
    private readonly issuerService: IssuerService,
    private readonly certificateLogService: CertificateLogService,
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
  @UseGuards(AuthVerifiedGuard('jwt'), RolesGuard, PermissionGuard)
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
  @ACLModules('ADMIN_REGISTRANT_ORGANIZATION_CRUDL')
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
  @UseGuards(AuthVerifiedGuard('jwt'), RolesGuard, PermissionGuard)
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
  @UseGuards(AuthVerifiedGuard('jwt'), RolesGuard, PermissionGuard)
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
  @UseGuards(AuthVerifiedGuard('jwt'), RolesGuard, PermissionGuard)
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
    if (!newUsers?.length) {
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
  @UseGuards(AuthVerifiedGuard('jwt'), RolesGuard, PermissionGuard)
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
    if (!newOrgs?.length) {
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
  @UseGuards(AuthVerifiedGuard('jwt'), RolesGuard, PermissionGuard)
  @Roles(Role.Admin, Role.Registrant)
  @Permission('Write')
  @ACLModules('ADMIN_REGISTRANT_ORGANIZATION_CRUDL')
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
  @UseGuards(AuthVerifiedGuard('jwt'), RolesGuard, PermissionGuard)
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
  @UseGuards(AuthVerifiedGuard('jwt'), RolesGuard, PermissionGuard)
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
  @UseGuards(AuthVerifiedGuard('jwt'), RolesGuard, PermissionGuard)
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

    if (user.role === Role.Buyer || user.role === Role.Registrant) {
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
      if (otherOrgUsers.length <= 0) {
        await this.userService.remove(user.id);
        await this.organizationService.remove(user.organization.id);
      }
    } else {
      await this.invitationService.remove(user.email, user.organization.id);
      await this.userService.remove(user.id);
    }

    return responseSuccess();
  }

  @Get('/devices/autocomplete')
  @UseGuards(AuthVerifiedGuard('jwt'), RolesGuard, PermissionGuard)
  @Roles(Role.Admin)
  @Permission('Read')
  @ACLModules('ADMIN_MANAGEMENT_CRUDL')
  //@Roles(Role.Registrant, Role.SiteOperator)
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
   * It is GET api to list all Registrants with pagination and filteration by Organization.
   */
  @Get('/registrants')
  @UseGuards(AuthVerifiedGuard('jwt'), RolesGuard, PermissionGuard)
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
  public async getRegistrants(
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
    // this.logger.verbose(`With in getAllRegistrants`);
    return this.userService.getRegistrants(organizationName, pageNumber, limit);
  }

  /**
   * Admin manual reissue. Reissues certificates for the given device externalIds
   * against the given reservation (groupId), over a specified or default window
   * (defaults to group.reservationStartDate..reservationEndDate).
   *
   * Why this exists: the legacy endReservation() cascade unlinked devices the
   * moment reservationEndDate passed, leaving any in-window reads unminted.
   * The DB-level repair restored device.groupId for the orphaned set, but in
   * cases where devices have since been re-attached to a follow-on reservation
   * (e.g. 69115b → 88079), the only safe way to mint the missed window is a
   * targeted reissue that doesn't touch the current FK.
   *
   * Idempotent: devices that already have a per-device certificate log row
   * overlapping the target window are skipped. Pass `dryRun: true` to preview
   * without writing.
   */
  @Post('/reissue-certificate')
  @Roles(Role.Admin)
  @Permission('Write')
  @ACLModules('ADMIN_MANAGEMENT_CRUDL')
  @ApiOperation({
    summary:
      'Manually reissue certificates for a (group, externalIds, window) tuple',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Reissue summary.' })
  public async reissueCertificate(
    @Body() body: ReissueCertificateDTO,
  ): Promise<{
    groupId: number;
    window: { start: string; end: string };
    dryRun: boolean;
    requested: number;
    eligible: string[];
    skippedNotFound: string[];
    skippedAlreadyIssued: string[];
    issued: string[];
    errors: { externalId: string; message: string }[];
  }> {
    const group = await this.deviceGroupService.adminFindGroupById(
      body.groupId,
    );
    if (!group) {
      throw new NotFoundException(`No device_group with id ${body.groupId}`);
    }

    const windowStart = body.startDate
      ? new Date(body.startDate)
      : new Date(group.reservationStartDate);
    const windowEnd = body.endDate
      ? new Date(body.endDate)
      : new Date(group.reservationEndDate);

    const eligible: string[] = [];
    const skippedNotFound: string[] = [];
    const skippedAlreadyIssued: string[] = [];
    const issued: string[] = [];
    const errors: { externalId: string; message: string }[] = [];

    const dryRun = !!body.dryRun;

    // First pass: filter out missing devices and already-issued ones so the
    // caller can see the planned set even in dryRun.
    const devicesToIssue = [];
    for (const externalId of body.externalIds) {
      const device = await this.deviceService.findByExternalId(externalId);
      if (!device) {
        skippedNotFound.push(externalId);
        continue;
      }
      const already =
        await this.certificateLogService.hasIssuedForDeviceInWindow(
          body.groupId,
          externalId,
          windowStart,
          windowEnd,
        );
      if (already) {
        skippedAlreadyIssued.push(externalId);
        continue;
      }
      eligible.push(externalId);
      devicesToIssue.push(device);
    }

    if (dryRun) {
      return {
        groupId: body.groupId,
        window: {
          start: windowStart.toISOString(),
          end: windowEnd.toISOString(),
        },
        dryRun: true,
        requested: body.externalIds.length,
        eligible,
        skippedNotFound,
        skippedAlreadyIssued,
        issued: [],
        errors: [],
      };
    }

    if (devicesToIssue.length === 0) {
      return {
        groupId: body.groupId,
        window: {
          start: windowStart.toISOString(),
          end: windowEnd.toISOString(),
        },
        dryRun: false,
        requested: body.externalIds.length,
        eligible,
        skippedNotFound,
        skippedAlreadyIssued,
        issued: [],
        errors: [],
      };
    }

    // The issuer reads group.devices to know which devices' reads to total
    // and mint against. We hand-assemble the device list rather than relying
    // on device.groupId so devices currently attached to another reservation
    // (e.g. moved to a follow-on PO) can still be reissued for this older
    // window. Per-device so one bad device doesn't poison the whole batch.
    for (const device of devicesToIssue) {
      try {
        const issuanceGroup = { ...group, devices: [device] } as typeof group;
        await this.issuerService.issueCertificate(
          issuanceGroup,
          // nextIssuance is only used for cycle bookkeeping that doesn't apply
          // to a one-shot manual reissue; passing a minimal stub is fine.
          { id: 0 } as any,
          DateTime.fromJSDate(windowStart).toUTC(),
          DateTime.fromJSDate(windowEnd).toUTC(),
          device.countryCode,
        );
        issued.push(device.externalId);
      } catch (e: any) {
        errors.push({
          externalId: device.externalId,
          message: e?.message ?? String(e),
        });
      }
    }

    return {
      groupId: body.groupId,
      window: {
        start: windowStart.toISOString(),
        end: windowEnd.toISOString(),
      },
      dryRun: false,
      requested: body.externalIds.length,
      eligible,
      skippedNotFound,
      skippedAlreadyIssued,
      issued,
      errors,
    };
  }
}

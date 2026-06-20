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
import { AuthGuard } from '@nestjs/passport';
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
import { ActiveUserGuard, PermissionGuard, RolesGuard } from '../../guards';
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
import { Connection } from 'typeorm';
import { InjectConnection } from '@nestjs/typeorm';
import { LateOngoingIssuanceService } from '../issuer/services/late-ongoing-issuance.service';
import { RepairStrandedMintsDTO } from './dto/repair-stranded-mints.dto';
import { IssuerService } from '../issuer/services/issuer.service';
import { CertificateLogService } from '../certificate-log/certificate-log.service';
import { ReissueCertificateDTO } from './dto/reissue-certificate.dto';
import { DateTime } from 'luxon';
@ApiTags('Admin')
@ApiBearerAuth('access-token')
@Controller('admin')
@UseGuards(AuthGuard('jwt'), ActiveUserGuard, RolesGuard, PermissionGuard)
@UseInterceptors(NullOrUndefinedResultInterceptor)
export class AdminController {
  constructor(
    private readonly userService: UserService,
    private readonly organizationService: OrganizationService,
    private readonly deviceService: DeviceService,
    private readonly deviceGroupService: DeviceGroupService,
    private readonly invitationService: InvitationService,
    @InjectConnection() private readonly connection: Connection,
    private readonly lateOngoingIssuanceService: LateOngoingIssuanceService,
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
  @UseGuards(AuthGuard('jwt'), ActiveUserGuard, RolesGuard, PermissionGuard)
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
  @UseGuards(AuthGuard('jwt'), ActiveUserGuard, RolesGuard, PermissionGuard)
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
  @UseGuards(AuthGuard('jwt'), ActiveUserGuard, RolesGuard, PermissionGuard)
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
  @UseGuards(AuthGuard('jwt'), ActiveUserGuard, RolesGuard, PermissionGuard)
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
  @UseGuards(AuthGuard('jwt'), ActiveUserGuard, RolesGuard, PermissionGuard)
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
  @UseGuards(AuthGuard('jwt'), ActiveUserGuard, RolesGuard, PermissionGuard)
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
  @UseGuards(AuthGuard('jwt'), ActiveUserGuard, RolesGuard, PermissionGuard)
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
  @UseGuards(AuthGuard('jwt'), ActiveUserGuard, RolesGuard, PermissionGuard)
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
  @UseGuards(AuthGuard('jwt'), ActiveUserGuard, RolesGuard, PermissionGuard)
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
  @UseGuards(AuthGuard('jwt'), ActiveUserGuard, RolesGuard, PermissionGuard)
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
  @UseGuards(AuthGuard('jwt'), ActiveUserGuard, RolesGuard, PermissionGuard)
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
  @UseGuards(AuthGuard('jwt'), ActiveUserGuard, RolesGuard, PermissionGuard)
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

  /**
   * Repair "stranded mints" — meter reads that look minted (mr.certified=true
   * AND a Requested row in check_certificate_issue_date_log_for_device) but
   * have no matching token in certificate_read_model.metadata.deviceIds. This
   * is the half-finished-mint pattern that bit POs 01464 / 30848 / 90506
   * on 2026-05-16/17, where the issuance pipeline updated the DB as if the
   * mint had succeeded but the on-chain certificate was never actually
   * created. The next issuance pass then skips the read (cert log "Requested"
   * row trips the idempotency check) so the token never lands without manual
   * cleanup.
   *
   * Operation:
   *   1. Find reads in the group whose start_date is in window and which
   *      have no token in certificate_read_model where metadata.deviceIds
   *      contains the read's externalId AND the generation range overlaps.
   *   2. For each such read: delete the stranded cert log row, reset
   *      mr.certified=false, insert a *bracketed* cycle (start_date - 1s,
   *      end_date + 1s) to dodge the TypeORM Between boundary issue.
   *   3. Trigger late-ongoing for the group so the issuer retries.
   *
   * dryRun returns the list of stranded reads without writing anything or
   * queuing issuance.
   */
  @Post('/repair-stranded-mints')
  @Roles(Role.Admin)
  @Permission('Write')
  @ACLModules('ADMIN_MANAGEMENT_CRUDL')
  @ApiOperation({
    summary:
      'Repair stranded half-finished mints: reads marked certified but missing their on-chain token',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Repair summary.' })
  public async repairStrandedMints(
    @Body() body: RepairStrandedMintsDTO,
  ): Promise<{
    groupId: number;
    dryRun: boolean;
    strandedCount: number;
    stranded: Array<{ externalId: string; start: string; end: string }>;
    repaired?: {
      logRowsCleared: number;
      readsReset: number;
      cyclesInserted: number;
    };
  }> {
    const startMin = body.startDateMin ?? '2025-01-01';
    const dryRun = !!body.dryRun;

    // Identify stranded reads. The token model stores the device externalId
    // inside metadata.deviceIds as a JSONB array; the group itself sits in
    // certificate_read_model."deviceId" (yes, confusingly named).
    const stranded: Array<{
      read_id: number;
      external_id: string;
      start_date: Date;
      end_date: Date;
    }> = await this.connection.query(
      `WITH r AS (
         SELECT d."groupId" AS gid, mr.id AS read_id, mr.external_id,
                mr.start_date, mr.end_date
           FROM device d
           JOIN meter_reads mr ON mr.external_id = d."externalId"::text
          WHERE d."groupId" = $1
            AND mr.type = 'Delta'
            AND mr.value > 100
            AND mr.start_date >= $2::timestamp
       ),
       t AS (
         SELECT "deviceId"::int AS gid,
                jsonb_array_elements_text(metadata::jsonb->'deviceIds') AS ext_id,
                to_timestamp("generationStartTime") AS s,
                to_timestamp("generationEndTime") AS e
           FROM certificate_read_model
          WHERE "deviceId" = $1::text
       )
       SELECT r.read_id, r.external_id, r.start_date, r.end_date
         FROM r
         LEFT JOIN t
           ON t.gid = r.gid
          AND t.ext_id = r.external_id
          AND t.s <= r.end_date
          AND t.e >= r.start_date
        WHERE t.ext_id IS NULL
        ORDER BY r.start_date, r.external_id`,
      [body.groupId, startMin],
    );

    const summary = stranded.map((s) => ({
      externalId: s.external_id,
      start: new Date(s.start_date).toISOString(),
      end: new Date(s.end_date).toISOString(),
    }));

    if (dryRun || stranded.length === 0) {
      return {
        groupId: body.groupId,
        dryRun,
        strandedCount: stranded.length,
        stranded: summary,
      };
    }

    // Per-read repair inside a single transaction. Bracketed cycle uses
    // (start_date - 1s, end_date + 1s) so the read's endDate is strictly
    // inside the window — daily 24h windows have boundary-equality issues
    // with TypeORM Between against a `timestamp without time zone` column.
    let logRowsCleared = 0;
    let readsReset = 0;
    let cyclesInserted = 0;

    await this.connection.transaction(async (m) => {
      const ids = stranded.map((s) => s.read_id);
      const extWithRange = stranded.map((s) => ({
        externalId: s.external_id,
        sd: new Date(s.start_date).toISOString(),
        ed: new Date(s.end_date).toISOString(),
      }));

      for (const r of extWithRange) {
        const del = await m.query(
          `DELETE FROM check_certificate_issue_date_log_for_device
            WHERE "externalId" = $1
              AND certificate_issuance_startdate <= $3::timestamp
              AND certificate_issuance_enddate   >= $2::timestamp`,
          [r.externalId, r.sd, r.ed],
        );
        logRowsCleared += Array.isArray(del) ? 0 : del?.[1] ?? 0;
      }

      const upd = await m.query(
        `UPDATE meter_reads SET certified = false WHERE id = ANY($1::int[])`,
        [ids],
      );
      readsReset = Array.isArray(upd) ? 0 : upd?.[1] ?? ids.length;

      for (const r of extWithRange) {
        await m.query(
          `INSERT INTO device_lateongoing_certificate_cycle
             ("groupId", device_externalid, late_start_date, late_end_date,
              certificate_issued, "createdAt", "updatedAt", archived_at, checked_at)
           VALUES ($1, $2,
                   to_char(($3::timestamp - interval '1 second'), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
                   to_char(($4::timestamp + interval '1 second'), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
                   false, now(), now(), NULL, NULL)`,
          [body.groupId, r.externalId, r.sd, r.ed],
        );
        cyclesInserted++;
      }
    });

    // Queue the issuance retry for this group so the issuer picks up the
    // freshly-inserted cycles. lifo=true on the queue add means this jumps
    // to the head of pending jobs.
    await this.lateOngoingIssuanceService.triggerIssuance(body.groupId);

    return {
      groupId: body.groupId,
      dryRun: false,
      strandedCount: stranded.length,
      stranded: summary,
      repaired: { logRowsCleared, readsReset, cyclesInserted },
    };
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
    summary: 'Manually reissue certificates for a (group, externalIds, window) tuple',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Reissue summary.' })
  public async reissueCertificate(
    @Body() body: ReissueCertificateDTO,
  ): Promise<{
    groupId: number;
    window: { start: string; end: string };
    dryRun: boolean;
    force: boolean;
    requested: number;
    eligible: string[];
    skippedNotFound: string[];
    skippedAlreadyIssued: string[];
    issued: string[];
    errors: { externalId: string; message: string }[];
  }> {
    const group = await this.deviceGroupService.adminFindGroupById(body.groupId);
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
    const force = !!body.force;

    // First pass: filter out missing devices and already-issued ones so the
    // caller can see the planned set even in dryRun. When `force` is set the
    // hasIssuedForDeviceInWindow guard is bypassed — used for "phantom" cycles
    // where a per-device cert-log row exists but no certificate was ever
    // minted, so the guard would otherwise wrongly skip the read.
    const devicesToIssue = [];
    for (const externalId of body.externalIds) {
      const device = await this.deviceService.findByExternalId(externalId);
      if (!device) {
        skippedNotFound.push(externalId);
        continue;
      }
      const already = force
        ? false
        : await this.certificateLogService.hasIssuedForDeviceInWindow(
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
        window: { start: windowStart.toISOString(), end: windowEnd.toISOString() },
        dryRun: true,
        force,
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
        window: { start: windowStart.toISOString(), end: windowEnd.toISOString() },
        dryRun: false,
        force,
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
        errors.push({ externalId: device.externalId, message: e?.message ?? String(e) });
      }
    }

    return {
      groupId: body.groupId,
      window: { start: windowStart.toISOString(), end: windowEnd.toISOString() },
      dryRun: false,
      force,
      requested: body.externalIds.length,
      eligible,
      skippedNotFound,
      skippedAlreadyIssued,
      issued,
      errors,
    };
  }
}

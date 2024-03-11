import { NullOrUndefinedResultInterceptor } from '@energyweb/origin-backend-utils';
import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  HttpStatus,
  Param,
  UseGuards,
  UseInterceptors,
  ForbiddenException,
  ParseIntPipe,
  NotFoundException,
  Put,
  BadRequestException,
  Query,
  DefaultValuePipe,
  ValidationPipe,
  Logger,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiResponse,
  ApiSecurity,
  ApiNotFoundResponse,
  ApiTags,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import {
  OrganizationDTO,
  NewOrganizationDTO,
  BindBlockchainAccountDTO,
} from './dto';
import { OrganizationService } from './organization.service';
import { UserService } from '../user/user.service';
import { InvitationService } from '../invitation/invitation.service';
import { UserDTO } from '../user/dto/user.dto';
import { UserDecorator } from '../user/decorators/user.decorator';
import { Role } from '../../utils/enums/role.enum';
import { Roles } from '../user/decorators/roles.decorator';
import {
  ensureOrganizationRole,
  ILoggedInUser,
  isRole,
  ResponseSuccess,
} from '../../models';
import { ActiveUserGuard, PermissionGuard, RolesGuard } from '../../guards';
import { SuccessResponseDTO } from '@energyweb/origin-backend-utils';
import { InvitationDTO } from '../invitation/dto/invitation.dto';
import { UpdateMemberDTO } from './dto/organization-update-member.dto';
import { Permission } from '../permission/decorators/permission.decorator';
import { ACLModules } from '../access-control-layer-module-service/decorator/aclModule.decorator';
import { OrganizationFilterDTO } from '../admin/dto/organization-filter.dto';

@ApiTags('organization')
@ApiBearerAuth('access-token')
@ApiSecurity('drec')
@Controller('/Organization')
@UseGuards(AuthGuard('jwt'), PermissionGuard)
@UseInterceptors(NullOrUndefinedResultInterceptor)
export class OrganizationController {
  private readonly logger = new Logger(OrganizationController.name);

  constructor(
    private readonly organizationService: OrganizationService,
    private userService: UserService,
    private invitationservice: InvitationService,
  ) {}

  /**
   *
   * @param param0
   * @returns
   */
  @Get('/me')
  @Permission('Read')
  @ACLModules('ORGANIZATION_MANAGEMENT_CRUDL')
  @ApiResponse({
    status: HttpStatus.OK,
    type: OrganizationDTO,
    description: 'Gets user`s organization',
  })
  async getMyOrganization(
    @UserDecorator() { organizationId }: ILoggedInUser,
  ): Promise<OrganizationDTO | undefined> {
    this.logger.verbose('With in getOrg at org controller');
    return await this.organizationService.findOne(organizationId);
  }
  /**
   * This Api route to get all organization of apiuser
   * @param param0
   * @returns
   */
  @Get('/apiuser/all_organization')
  @UseGuards(AuthGuard(['jwt', 'oauth2-client-password']), PermissionGuard)
  @Roles(Role.ApiUser)
  @Permission('Read')
  @ACLModules('ORGANIZATION_MANAGEMENT_CRUDL')
  @ApiQuery({ name: 'pageNumber', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiResponse({
    type: [OrganizationDTO],
    description: 'Returns all Organizations',
  })
  async getAllOrganizations(
    @UserDecorator() loggedUser: ILoggedInUser,
    @Query(ValidationPipe) filterDto: OrganizationFilterDTO,
    @Query('pageNumber', new DefaultValuePipe(1), ParseIntPipe)
    pageNumber: number,
    @Query('limit', new DefaultValuePipe(0), ParseIntPipe) limit: number,
  ) /*: Promise<OrganizationDTO[]>*/ {
    this.logger.verbose(`With in getAllOrganizations`);
    return await this.organizationService.getAll(
      filterDto,
      pageNumber,
      limit,
      loggedUser,
    );
  }

  /**
   *
   * @param param0
   * @param pageNumber
   * @param limit
   * @returns
   */
  @Get('/users')
  @UseGuards(AuthGuard(['jwt', 'oauth2-client-password']), PermissionGuard)
  @Permission('Read')
  @ACLModules('ORGANIZATION_MANAGEMENT_CRUDL')
  @ApiQuery({ name: 'pageNumber', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [UserDTO],
    description: 'Gets organization`s users',
  })
  @ApiNotFoundResponse({
    description: `There are no users associated to this organization`,
  })
  async getOrganizationUsers(
    @UserDecorator() loggedUser: ILoggedInUser,
    @Query('pageNumber', new DefaultValuePipe(1), ParseIntPipe)
    pageNumber: number,
    @Query('limit', new DefaultValuePipe(0), ParseIntPipe) limit: number,
  ) /*: Promise<UserDTO[]>*/ {
    this.logger.verbose(`With in getOrganizationUsers`);
    if (loggedUser.role === Role.ApiUser) {
      return this.organizationService.findApiuserOrganizationUsers(
        loggedUser.api_user_id,
        pageNumber,
        limit,
      );
    } else {
      return this.organizationService.findOrganizationUsers(
        loggedUser.organizationId,
        pageNumber,
        limit,
        loggedUser.role,
      );
    }
  }

  /**
   * It is GET api to fetch an organization renord.
   * @param {orhanizationId} is type of number which is the identifier of an organization
   * @return { OrganizationDTO | undefined } OrganizationDto is for success response
   * and undefined when there is no particular record not available.
   */
  @Get('/:id')
  @UseGuards(AuthGuard(['jwt', 'oauth2-client-password']), PermissionGuard)
  //  @Roles(Role.Admin)
  @Permission('Read')
  @ACLModules('ORGANIZATION_MANAGEMENT_CRUDL')
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
    this.logger.verbose(`With in getOrganizationById`);
    return this.organizationService.findOne(organizationId);
  }
  /**
   *
   * @param organizationId
   * @param loggedUser
   * @returns
   */
  @Get('/:id/invitations')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Permission('Read')
  @ACLModules('ORGANIZATION_MANAGEMENT_CRUDL')
  @ApiResponse({
    status: HttpStatus.OK,
    type: [InvitationDTO],
    description: 'Gets invitations for an organization',
  })
  async getInvitationsForOrganization(
    @Param('id', new ParseIntPipe()) organizationId: number,
    @UserDecorator() loggedUser: ILoggedInUser,
  ): Promise<InvitationDTO[]> {
    this.logger.verbose(`With in getInvitationsForOrganization`);
    this.ensureOrganizationMemberOrAdmin(loggedUser, organizationId);

    const organization = await this.organizationService.findOne(organizationId);

    return organization?.invitations.map((inv) =>
      InvitationDTO.fromInvitation(inv),
    );
  }
  /**
   * This api route use for add organization afte user login (but now it directly added at register time)
   * @param organizationToRegister
   * @param loggedUser
   * @returns {OrganizationDTO}
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.OrganizationAdmin)
  @Permission('Write')
  @ACLModules('ORGANIZATION_MANAGEMENT_CRUDL')
  @ApiResponse({
    status: HttpStatus.OK,
    type: OrganizationDTO,
    description: 'Returns a new created Organization',
  })
  public async register(
    @Body() organizationToRegister: NewOrganizationDTO,
    @UserDecorator() loggedUser: ILoggedInUser,
  ): Promise<OrganizationDTO> {
    this.logger.verbose(`With in register`);
    if (loggedUser.organizationId) {
      this.logger.error(
        `There is already an organization assigned to this account`,
      );
      throw new BadRequestException({
        success: false,
        message: `There is already an organization assigned to this account`,
      });
    }
    return await this.organizationService.create(
      organizationToRegister,
      loggedUser,
    );
  }
  /**
   * This Api route use for change the user role
   * @param organizationId ;number "in api param is id"
   * @param memberId :number "in api param is userId"
   * @body {role}
   * @param loggedUser
   * @returns {SuccessResponseDTO}
   */
  @Put(':id/change-role/:userId')
  @UseGuards(AuthGuard(), ActiveUserGuard, RolesGuard)
  @Roles(Role.OrganizationAdmin, Role.Admin)
  @Permission('Write')
  @ACLModules('ORGANIZATION_MANAGEMENT_CRUDL')
  @ApiBody({ type: UpdateMemberDTO })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SuccessResponseDTO,
    description: 'change role of user',
  })
  async changeMemberRole(
    @Param('id', new ParseIntPipe()) organizationId: number,
    @Param('userId', new ParseIntPipe()) memberId: number,
    @Body() { role }: UpdateMemberDTO,
    @UserDecorator() loggedUser: ILoggedInUser,
  ): Promise<SuccessResponseDTO> {
    this.logger.verbose(`With in changeMemberRole`);
    this.ensureOrganizationMemberOrAdmin(loggedUser, organizationId);

    try {
      ensureOrganizationRole(role);
    } catch (e) {
      this.logger.error(`Forbidden Error`);
      throw new ForbiddenException();
    }

    await this.organizationService.changeMemberRole(
      loggedUser.organizationId,
      memberId,
      role,
    );

    return ResponseSuccess();
  }

  /**
   * This api route for Set blockchain address and singh for organization(for now we using static default value)
   * @param param0
   * @param param1
   * @returns {BindBlockchainAccountDTO}
   */
  @Post('chain-address')
  @UseGuards(AuthGuard('jwt'), ActiveUserGuard)
  @Permission('Write')
  @ACLModules('ORGANIZATION_MANAGEMENT_CRUDL')
  @ApiBody({ type: BindBlockchainAccountDTO })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SuccessResponseDTO,
    description: `Set the organization blockchain address`,
  })
  public async setBlockchainAddress(
    @UserDecorator() { organizationId }: ILoggedInUser,
    @Body() { signedMessage }: BindBlockchainAccountDTO,
  ): Promise<SuccessResponseDTO> {
    this.logger.verbose(`With in setBlockchainAddress`);
    if (!organizationId) {
      this.logger.error(`User is not a part of an organization.`);
      throw new NotFoundException('User is not a part of an organization.');
    }

    return this.organizationService.setBlockchainAddress(
      organizationId,
      signedMessage,
    );
  }

  private ensureOrganizationMemberOrAdmin(
    user: ILoggedInUser,
    organizationId: number,
  ) {
    this.logger.verbose(`With in ensureOrganizationMemberOrAdmin`);
    const isOrganizationMember = user.organizationId === organizationId;
    const hasAdminRole = isRole(user.role, Role.Admin);

    if (hasAdminRole) {
      return;
    }
    if (!isOrganizationMember) {
      this.logger.error(`Not a member of the organization.`);
      throw new ForbiddenException('Not a member of the organization.');
    }
  }
  @Delete('/user/:id')
  @UseGuards(
    AuthGuard(['jwt', 'oauth2-client-password']),
    ActiveUserGuard,
    PermissionGuard,
  )
  @Permission('Delete')
  @ACLModules('ORGANIZATION_MANAGEMENT_CRUDL')
  @ApiResponse({
    status: HttpStatus.OK,
    type: SuccessResponseDTO,
    description: 'Delete an user of organization',
  })
  async deleteUser(
    @UserDecorator() loggedUser: ILoggedInUser,
    @Param('id', new ParseIntPipe()) userid: number,
  ): Promise<SuccessResponseDTO> {
    const user = await this.userService.findById(userid);
    if (
      loggedUser.role === Role.ApiUser &&
      // @ts-ignore ts(2339)
      loggedUser.api_user_id != user.api_user_id
    ) {
      throw new NotFoundException('User does not exist in this organization');
    } else {
      if (!user && user.organization.id != loggedUser.organizationId) {
        throw new NotFoundException('User does not exist in this organization');
      }
    }

    //const manyotheruserinorg = await this.userService.getatleastoneotheruserinOrg(user.organization.id, user.id)

    if (user.role === loggedUser.role && user.status === 'Active') {
      throw new NotFoundException('Unauthorized');
    } else {
      await this.invitationservice.remove(user.email, user.organization.id);
      await this.userService.remove(user.id);
    }
    return ResponseSuccess();
  }
}

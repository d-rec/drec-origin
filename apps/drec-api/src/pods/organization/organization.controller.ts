import { NullOrUndefinedResultInterceptor } from '@energyweb/origin-backend-utils';
import {
  Controller,
  Get,
  Post,
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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiResponse,
  ApiSecurity,
  ApiNotFoundResponse,
  ApiTags,
  ApiBody,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import {
  OrganizationDTO,
  NewOrganizationDTO,
  BindBlockchainAccountDTO,
} from './dto';
import { OrganizationService } from './organization.service';
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
import { ActiveUserGuard, PermissionGuard,RolesGuard } from '../../guards';
import { SuccessResponseDTO } from '@energyweb/origin-backend-utils';
import { InvitationDTO } from '../invitation/dto/invitation.dto';
import { UpdateMemberDTO } from './dto/organization-update-member.dto';
import { Permission } from '../permission/decorators/permission.decorator';
import { ACLModules } from '../access-control-layer-module-service/decorator/aclModule.decorator';

@ApiTags('organization')
@ApiBearerAuth('access-token')
@ApiSecurity('drec')
@Controller('/Organization')
@UseGuards(AuthGuard('jwt'),PermissionGuard)
@UseInterceptors(NullOrUndefinedResultInterceptor)
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

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
    console.log("With in getOrg at org controller",organizationId);
    return await this.organizationService.findOne(organizationId);
  }

  @Get('/users')
  @Permission('Read')
  @ACLModules('ORGANIZATION_MANAGEMENT_CRUDL')
  @ApiResponse({
    status: HttpStatus.OK,
    type: [UserDTO],
    description: 'Gets organization`s users',
  })
  @ApiNotFoundResponse({
    description: `There are no users associated to this organization`,
  })
  async getOrganizationUsers(
    @UserDecorator() { organizationId }: ILoggedInUser,
  ): Promise<UserDTO[]> {
    return this.organizationService.findOrganizationUsers(organizationId);
  }

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
    this.ensureOrganizationMemberOrAdmin(loggedUser, organizationId);

    const organization = await this.organizationService.findOne(organizationId);

    return organization?.invitations.map((inv) =>
      InvitationDTO.fromInvitation(inv),
    );
  }

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
    if (loggedUser.organizationId) {
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

  @Put(':id/change-role/:userId')
  @UseGuards(AuthGuard(), ActiveUserGuard, RolesGuard)
  @Roles(Role.OrganizationAdmin, Role.Admin)
  @Permission('Write')
  @ACLModules('ORGANIZATION_MANAGEMENT_CRUDL')
  @ApiBody({ type: UpdateMemberDTO })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SuccessResponseDTO,
    description: 'Removes a member from an organization',
  })
  async changeMemberRole(
    @Param('id', new ParseIntPipe()) organizationId: number,
    @Param('userId', new ParseIntPipe()) memberId: number,
    @Body() { role }: UpdateMemberDTO,
    @UserDecorator() loggedUser: ILoggedInUser,
  ): Promise<SuccessResponseDTO> {
    this.ensureOrganizationMemberOrAdmin(loggedUser, organizationId);

    try {
      ensureOrganizationRole(role);
    } catch (e) {
      throw new ForbiddenException();
    }

    await this.organizationService.changeMemberRole(
      loggedUser.organizationId,
      memberId,
      role,
    );

    return ResponseSuccess();
  }

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
    if (!organizationId) {
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
    const isOrganizationMember = user.organizationId === organizationId;
    const hasAdminRole = isRole(user.role, Role.Admin);

    if (hasAdminRole) {
      return;
    }
    if (!isOrganizationMember) {
      throw new ForbiddenException('Not a member of the organization.');
    }
  }
}

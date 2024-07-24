import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpStatus,
  Logger,
  Param,
  Post,
  Put,
  UseGuards,
  UseInterceptors,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import {
  NullOrUndefinedResultInterceptor,
  SuccessResponseDTO,
} from '@energyweb/origin-backend-utils';

import {
  ApiBearerAuth,
  ApiBody,
  ApiResponse,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { InvitationService } from './invitation.service';
import { AlreadyPartOfOrganizationError } from './errors/already-part-of-organization.error';
import { InvitationDTO } from './dto/invitation.dto';
import {
  ensureOrganizationRole,
  ILoggedInUser,
  ResponseFailure,
  ResponseSuccess,
} from '../../models';
import { UserDecorator } from '../user/decorators/user.decorator';
import { Role } from '../../utils/enums';
import { ActiveUserGuard, PermissionGuard, RolesGuard } from '../../guards';
import { Roles } from '../user/decorators/roles.decorator';
import { Permission } from '../permission/decorators/permission.decorator';
import { ACLModules } from '../access-control-layer-module-service/decorator/aclModule.decorator';
import { InviteDTO, updateInviteStatusDTO } from './dto/invite.dto';

@ApiTags('invitation')
@ApiBearerAuth('access-token')
@Controller('/invitation')
@UseInterceptors(NullOrUndefinedResultInterceptor)
export class InvitationController {
  private logger = new Logger(InvitationController.name);

  constructor(
    private readonly organizationInvitationService: InvitationService,
  ) {}

  /**
   *
   * @param loggedUser
   * @returns
   */
  @Get()
  @UseGuards(AuthGuard(['jwt', 'oauth2-client-password']), PermissionGuard)
  @Permission('Read')
  @ACLModules('INVITATION_MANAGEMENT_CRUDL')
  @ApiQuery({
    name: 'organizationId',
    type: Number,
    required: false,
    description:
      'This organizationId can be used to retrieve records of apiuser',
  })
  @ApiQuery({ name: 'pageNumber', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [InvitationDTO],
    description: 'Gets all invitations for a user',
  })
  async getInvitations(
    @UserDecorator() loggedUser: ILoggedInUser,
    @Query('organizationId') organizationId?: number | null,
    @Query('pageNumber', new DefaultValuePipe(1), ParseIntPipe)
    pageNumber?: number,
    @Query('limit', new DefaultValuePipe(0), ParseIntPipe) limit?: number,
  ): Promise<{
    invitations: Invitation[];
    currentPage: number;
    totalPages: number;
    totalCount: number;
  }> {
    this.logger.verbose(`With in getInvitations`);
    const invitations =
      await this.organizationInvitationService.getUsersInvitation(
        loggedUser,
        organizationId,
        pageNumber,
        limit,
      );

    return invitations;
  }

  /**
   *
   * @param invitationId
   * @param useracceptinvitation
   * @returns
   */
  @Put(':id')
  @UseGuards(AuthGuard('jwt'), PermissionGuard)
  @Permission('Update')
  @ACLModules('INVITATION_MANAGEMENT_CRUDL')
  // @ApiParam({
  //   name: 'status',
  //   enum: OrganizationInvitationStatus,
  //   enumName: 'OrganizationInvitationStatus',
  // })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SuccessResponseDTO,
    description: 'Updates an invitation',
  })
  async updateInvitation(
    @Param('id') invitationId: number,
    //  @Param('status') status: IOrganizationInvitation['status'],
    @Body() useracceptinvitation: updateInviteStatusDTO,
    // @UserDecorator() loggedUser: ILoggedInUser,
  ): Promise<SuccessResponseDTO> {
    this.logger.verbose(`With in updateInvitation`);
    return this.organizationInvitationService.update(
      useracceptinvitation,
      invitationId,
      // status,
    );
  }

  /**
   *
   * @param param0
   * @param organizationId
   * @param loggedUser
   * @returns
   */
  @Post()
  @UseGuards(
    AuthGuard(['jwt', 'oauth2-client-password']),
    ActiveUserGuard,
    RolesGuard,
    PermissionGuard,
  )
  @Roles(
    Role.OrganizationAdmin,
    Role.Admin,
    Role.Buyer,
    Role.SubBuyer,
    Role.ApiUser,
  )
  @Permission('Write')
  @ACLModules('INVITATION_MANAGEMENT_CRUDL')
  @ApiBody({ type: InviteDTO })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: SuccessResponseDTO,
    description: 'Invites a user',
  })
  @ApiQuery({
    name: 'organizationId',
    required: false,
    type: Number,
    description: 'This query parameter is used to for admin...',
  })
  async invite(
    @Body() { email, role, firstName, lastName }: InviteDTO,
    @Query('organizationId') organizationId: number | null,
    @UserDecorator() loggedUser: ILoggedInUser,
  ): Promise<SuccessResponseDTO> {
    this.logger.verbose(`With in invite`);
    if (!loggedUser.hasOrganization) {
      this.logger.error(`User doesn't belong to any organization.`);
      throw new BadRequestException(
        ResponseFailure(`User doesn't belong to any organization.`),
      );
    }

    try {
      ensureOrganizationRole(role as Role);
    } catch (e) {
      this.logger.error(`Unknown role was requested for the invitee`);
      throw new ForbiddenException(
        ResponseFailure('Unknown role was requested for the invitee'),
      );
    }

    try {
      if (loggedUser.role === Role.Admin || loggedUser.role === Role.ApiUser) {
        if (organizationId === null || organizationId === undefined) {
          throw new BadRequestException(
            ResponseFailure(
              `Organization id is required,please add your Organization id`,
            ),
          );
        }
        await this.organizationInvitationService.invite(
          loggedUser,
          email,
          role,
          firstName,
          lastName,
          organizationId,
        );
      } else {
        await this.organizationInvitationService.invite(
          loggedUser,
          email,
          role,
          firstName,
          lastName,
          organizationId,
        );
      }
    } catch (error) {
      this.logger.error(error.toString());
      this.logger.error(
        error.toString() instanceof AlreadyPartOfOrganizationError,
      );
      //// if (error instanceof AlreadyPartOfOrganizationError) {
      this.logger.error(error.message);
      throw new ForbiddenException({
        message: error.message,
        status: error.status,
      });
      ///// }
      //  return error
    }

    return ResponseSuccess();
  }

  /**
   *
   * @param loggedUser
   * @returns
   */
  @Get('/By_email')
  @UseGuards(AuthGuard(['jwt', 'oauth2-client-password']), PermissionGuard)
  @Permission('Read')
  @ACLModules('INVITATION_MANAGEMENT_CRUDL')
  @ApiResponse({
    status: HttpStatus.OK,
    type: [InvitationDTO],
    description: 'Gets all invitations for a user',
  })
  async getInvitationsByemail(
    @UserDecorator() loggedUser: ILoggedInUser,
  ) :Promise<any> {
    this.logger.verbose(`With in getInvitations`);
    const invitations =
      await this.organizationInvitationService.getinvite_info_byEmail(
        loggedUser,
      );

    return invitations;
  }
}

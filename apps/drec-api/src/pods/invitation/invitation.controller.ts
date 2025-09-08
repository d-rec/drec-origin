import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  ForbiddenException,
  Get,
  HttpStatus,
  Logger,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { NullOrUndefinedResultInterceptor } from '../utils/origin-backend-utils/null-or-undefined-result-interceptor';
import { SuccessResponseDTO } from '../utils/origin-backend-utils/success-response.dto';

import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { InvitationService } from './invitation.service';
import { AlreadyPartOfOrganizationError } from './errors/already-part-of-organization.error';
import { InvitationDTO } from './dto/invitation.dto';
import {
  ensureOrganizationRole,
  ILoggedInUser,
  responseFailure,
  responseSuccess,
} from '../../models';
import { UserDecorator } from '../user/decorators/user.decorator';
import { Role } from '../../utils/enums';
import { ActiveUserGuard, PermissionGuard, RolesGuard } from '../../guards';
import { Roles } from '../user/decorators/roles.decorator';
import { Permission } from '../permission/decorators/permission.decorator';
import { ACLModules } from '../access-control-layer-module-service/decorator/aclModule.decorator';
import { InviteDTO, UpdateInviteStatusDTO } from './dto/invite.dto';
import { Invitation } from './invitation.entity';

@ApiTags('Invitation')
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
  @ApiOperation({
    summary: 'Get Invitations',
    description:
      'Retrieves all invitations associated with the authenticated user.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [InvitationDTO],
    description: 'Returns an array of invitations for the user.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description:
      'Forbidden. The user does not have permission to access this resource.',
  })
  @ApiQuery({
    name: 'organizationId',
    type: Number,
    required: false,
    description: 'Optional organization ID to filter invitations.',
  })
  @ApiQuery({ name: 'pageNumber', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
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
    return await this.organizationInvitationService.getUsersInvitation(
      loggedUser,
      organizationId,
      pageNumber,
      limit,
    );
  }

  /**
   *
   * @param invitationId
   * @param updateInviteStatusDTO
   * @returns
   */
  @Put(':id')
  @UseGuards(AuthGuard('jwt'), PermissionGuard)
  @Permission('Update')
  @ACLModules('INVITATION_MANAGEMENT_CRUDL')
  @ApiOperation({
    summary: 'Update Invitation',
    description:
      'Updates the status of an invitation based on the provided ID.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SuccessResponseDTO,
    description:
      'Returns a success response indicating the invitation has been updated.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The specified invitation does not exist.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Bad Request. The provided data is invalid or missing required fields.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description:
      'Forbidden. The user does not have permission to update this invitation.',
  })
  async updateInvitation(
    @Param('id') invitationId: number,
    //  @Param('status') status: IOrganizationInvitation['status'],
    @Body() updateInviteStatusDTO: UpdateInviteStatusDTO,
    // @UserDecorator() loggedUser: ILoggedInUser,
  ): Promise<SuccessResponseDTO> {
    this.logger.verbose(`With in updateInvitation`);
    return this.organizationInvitationService.update(
      updateInviteStatusDTO,
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
  @ApiOperation({
    summary: 'Invite a User',
    description: 'Sends an invitation to a user to join an organization.',
  })
  @ApiBody({ type: InviteDTO })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: SuccessResponseDTO,
    description: 'Successfully invited the user.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request data or missing required fields.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description:
      'Forbidden. The user does not have permission to invite members.',
  })
  @ApiQuery({
    name: 'organizationId',
    required: false,
    type: Number,
    description:
      'Optional ID of the organization to which the user is being invited.',
  })
  async invite(
    @Body() { email, role, firstName, lastName, phoneNumber }: InviteDTO,
    @Query('organizationId') organizationId: number | null,
    @UserDecorator() loggedUser: ILoggedInUser,
  ): Promise<SuccessResponseDTO> {
    this.logger.verbose(`With in invite`);
    if (!loggedUser.hasOrganization) {
      this.logger.error(`User doesn't belong to any organization.`);
      throw new BadRequestException(
        responseFailure(`User doesn't belong to any organization.`),
      );
    }

    try {
      ensureOrganizationRole(role as Role);
    } catch (e) {
      this.logger.error(`Unknown role was requested for the invitee`);
      throw new ForbiddenException(
        responseFailure('Unknown role was requested for the invitee'),
      );
    }

    try {
      if (loggedUser.role === Role.Admin || loggedUser.role === Role.ApiUser) {
        if (organizationId === null || organizationId === undefined) {
          throw new BadRequestException(
            responseFailure(
              `Organization id is required,please add your Organization id`,
            ),
          );
        }
        await this.organizationInvitationService.invite(
          loggedUser,
          email,
          phoneNumber,
          role,
          firstName,
          lastName,
          organizationId,
        );
      } else {
        await this.organizationInvitationService.invite(
          loggedUser,
          email,
          phoneNumber,
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

    return responseSuccess();
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
  @ApiOperation({
    summary: 'Get invitations by email',
    description:
      'Retrieves all invitations associated with the logged-in user’s email.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [InvitationDTO],
    description: 'Gets all invitations for a user.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description:
      'Forbidden. The user does not have permission to view invitations.',
  })
  async getInvitationsByEmail(
    @UserDecorator() loggedUser: ILoggedInUser,
  ): Promise<any> {
    this.logger.verbose(`With in getInvitations`);
    const invitations =
      await this.organizationInvitationService.getInviteInfoByEmail(loggedUser);

    return invitations;
  }
}

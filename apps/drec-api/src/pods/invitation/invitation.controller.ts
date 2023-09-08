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
  Query
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import {
  NullOrUndefinedResultInterceptor,
  SuccessResponseDTO,
} from '@energyweb/origin-backend-utils';

import {
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiQuery
} from '@nestjs/swagger';
import { InvitationService } from './invitation.service';
import { AlreadyPartOfOrganizationError } from './errors/already-part-of-organization.error';
import { InvitationDTO } from './dto/invitation.dto';
import {
  ensureOrganizationRole,
  ILoggedInUser,
  IOrganizationInvitation,
  ResponseFailure,
  ResponseSuccess,
} from '../../models';
import { UserDecorator } from '../user/decorators/user.decorator';
import { OrganizationInvitationStatus, Role } from '../../utils/enums';
import { ActiveUserGuard, RolesGuard } from '../../guards';
import { Roles } from '../user/decorators/roles.decorator';
import { InviteDTO,updateInviteStatusDTO } from './dto/invite.dto';

@ApiTags('invitation')
@ApiBearerAuth('access-token')
@Controller('/invitation')
@UseInterceptors(NullOrUndefinedResultInterceptor)
export class InvitationController {
  private logger = new Logger(InvitationController.name);

  constructor(
    private readonly organizationInvitationService: InvitationService,
  ) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiResponse({
    status: HttpStatus.OK,
    type: [InvitationDTO],
    description: 'Gets all invitations for a user',
  })
  async getInvitations(
    @UserDecorator() loggedUser: ILoggedInUser,
  ): Promise<InvitationDTO[]> {
    const invitations =
      await this.organizationInvitationService.getUsersInvitation(
        loggedUser.email,
      );

    return invitations;
  }

  @Put(':id')
 // @UseGuards(AuthGuard('jwt'))
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
    @Param('id') invitationId: string,
  //  @Param('status') status: IOrganizationInvitation['status'],
    @Body() useracceptinvitation:updateInviteStatusDTO
   // @UserDecorator() loggedUser: ILoggedInUser,
  ): Promise<SuccessResponseDTO> {
    return this.organizationInvitationService.update(
      useracceptinvitation,
      invitationId,
     // status,
    );
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), ActiveUserGuard, RolesGuard)
  @Roles(Role.OrganizationAdmin, Role.Admin, Role.Buyer,Role.SubBuyer)
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
    @Body() { email, role,firstName,lastName }: InviteDTO,
    @Query('organizationId') organizationId: number | null,
    @UserDecorator() loggedUser: ILoggedInUser,
  ): Promise<SuccessResponseDTO> {
    if (!loggedUser.hasOrganization) {
      throw new BadRequestException(
        ResponseFailure(`User doesn't belong to any organization.`),
      );
    }

    try {
      ensureOrganizationRole(role as Role);
    } catch (e) {
      throw new ForbiddenException(
        ResponseFailure('Unknown role was requested for the invitee'),
      );
    }

    try {
      await this.organizationInvitationService.invite(loggedUser,email,role,firstName,lastName,organizationId);
    } catch (error) {
      console.log(error)
      this.logger.error(error.toString());
      this.logger.error(error.toString() instanceof AlreadyPartOfOrganizationError);
     //// if (error instanceof AlreadyPartOfOrganizationError) {

      console.log("error")

        throw new ForbiddenException({ message: error.message,status:error.status });
     ///// }
    //  return error
    }

    return ResponseSuccess();
  }
}

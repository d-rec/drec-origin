import { BadRequestException, Injectable, Logger, ConflictException, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import {
  ILoggedInUser,
  ISuccessResponse,
  OrganizationRole,
  ResponseSuccess,
} from '../../models';
import { UserService } from '../user/user.service';
import { OrganizationInvitationStatus, Role } from '../../utils/enums';
import { AlreadyPartOfOrganizationError } from './errors';
import { Invitation } from './invitation.entity';
import { OrganizationService } from '../organization/organization.service';
import { Organization } from '../organization/organization.entity';
import { OrganizationDTO } from '../organization/dto';
import { MailService } from '../../mail/mail.service';
import { updateInviteStatusDTO } from './dto/invite.dto';
import { CreateUserORGDTO } from '../user/dto/create-user.dto';
import { PermissionService } from '../permission/permission.service'
import { UserStatus } from '@energyweb/origin-backend-core';
@Injectable()
export class InvitationService {
  private readonly logger = new Logger(InvitationService.name);
  inviteuseradd: Boolean = false;
  constructor(
    @InjectRepository(Invitation)
    private readonly invitationRepository: Repository<Invitation>,
    private readonly organizationService: OrganizationService,
    private readonly userService: UserService,
    private readonly mailService: MailService,
    private readonly PermissionService: PermissionService,
  ) { }

  public async invite(
    user: ILoggedInUser,
    email: string,
    role: OrganizationRole,
    firstName: string,
    lastName: string,
    orgId?: number
    // permission: NewPermissionDTO[],
  ): Promise<void> {
    this.logger.verbose(`With in invite`);
    const sender = await this.userService.findByEmail(user.email);
    let inviteorg: number;

    if (orgId) {
      if (user.role === Role.Admin || user.role === Role.ApiUser) {
        inviteorg = orgId;
      }
      else {
        if (user.organizationId != orgId) {
          this.logger.error(`Requested organization is part of other organization`);
          throw new ConflictException({
            success: false,
            message: `Requested organization is part of other organization`,
          });
        }
        else {
          inviteorg = user.organizationId;
        }
      }
    }
    const organization = await this.organizationService.findOne(
      inviteorg,
    );
    if (!organization) {
      this.logger.error(`Organization information not found`);
      throw new ConflictException({
        success: false,
        message: `Organization information not found`,
      });
    }
    if (user.role === Role.ApiUser) {
      if (user.api_user_id !== organization.api_user_id) {
        this.logger.error(`Organization ${organization.name} is part of other apiuser or developer`);
        throw new ConflictException({
          success: false,
          message: `Organization ${organization.name} is part of other apiuser or developer`,
        });
      }
    }
    const lowerCaseEmail = email.toLowerCase();

    const invitee = await this.userService.findByEmail(lowerCaseEmail);

    if (invitee && invitee.organization) {
      if (invitee.organization.id === inviteorg) {
        this.logger.error(`User ${lowerCaseEmail} is already part of this organization`);
        throw new ConflictException({
          success: false,
          message: `User ${lowerCaseEmail} is already part of this organization`,
        });
      } else {
        this.logger.error(`User ${lowerCaseEmail} is already part of the other organization`);
        throw new ConflictException({
          success: false,
          message: `User ${lowerCaseEmail} is already part of the other organization`,
        });
      }


    }

    const orginvitee = await this.invitationRepository.findOne({
      where: {
        email: lowerCaseEmail,
        organization: inviteorg
      },
      relations: ['organization'],
    });
    //console.log(invitation)
    if (orginvitee) {
      this.logger.error(`Requested invitation User ${lowerCaseEmail} is already exist`);
      throw new BadRequestException(`Requested invitation User ${lowerCaseEmail} is already exist`);
    }
    this.ensureIsNotMember(lowerCaseEmail, organization);
    var saveinviteuser: any = {};
    if (!organization.invitations.find((u) => u.email === lowerCaseEmail)) {
      saveinviteuser = await this.invitationRepository.save({
        email: lowerCaseEmail,
        organization,
        role,
        status: OrganizationInvitationStatus.Pending,
        sender: sender ? `${sender.firstName} ${sender.lastName}` : '',
      });
    }
    var randPassword = Array(10).fill("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz").map(function (x) { return x[Math.floor(Math.random() * x.length)] }).join('');
    var inviteuser: CreateUserORGDTO = {
      firstName: firstName,
      lastName: lastName,
      email: email.toLowerCase(),
      password: randPassword,
      orgName: organization.name,
      organizationType: organization.organizationType,
      //@ts-ignore
      orgid?: organization.id
      // orgAddress:''

    }
    var userid: any;
    this.logger.debug("invitee")
    //to add for if one user invite by multiple organization 
    // if (invitee) {
    //   userid = invitee

    // } else {
    //let client;
    inviteuser['client'] = { api_user_id: organization.api_user_id }
    userid = await this.userService.newcreate(inviteuser, UserStatus.Pending, true);

    //}
    var updateinviteuser: updateInviteStatusDTO = {
      email: lowerCaseEmail,
      status: OrganizationInvitationStatus.Accepted
    }

    //await this.update(updateinviteuser, saveinviteuser.id)
    if (sender.role !== Role.ApiUser) {
      await this.userService.sentinvitiontoUser(inviteuser, lowerCaseEmail, saveinviteuser.id);
    }
    //to add permission for user role in invitaion
    // const newpermission: any = [];
    // await permission.forEach((element) => {
    //   newpermission.push({
    //     aclmodulesId: element.aclmodulesId,
    //     entityType: element.entityType,
    //     entityId: userid.id,
    //     permissions: element.permissions,
    //     status: 0
    //   })
    // })
    // var permissionId: any = [];

    // await Promise.all(
    //   newpermission.map(
    //     async (newpermission: NewPermissionDTO) => {
    //       //console.log(newpermission)
    //       const perId = await this.PermissionService.create(newpermission, user)
    //       //console.log(perId);
    //       permissionId.push(perId.id);
    //     }),
    // );

    //console.log(permissionId);
    // await this.invitationRepository.update(saveinviteuser.id, { permissionId });

    //
  }

  public async update(
    user: updateInviteStatusDTO,
    invitationId: string,
    // status: OrganizationInvitationStatus,
  ): Promise<ISuccessResponse> {
    this.logger.verbose(`With in update`);
    const lowerCaseEmail = user.email.toLowerCase();
    const userinvite = await this.userService.findByEmail(lowerCaseEmail)
    this.logger.debug(userinvite);
    const invitation = await this.invitationRepository.findOne(invitationId, {
      where: {
        email: lowerCaseEmail,
      },
      relations: ['organization'],
    });
    //console.log(invitation)
    if (!invitation) {
      this.logger.error(`Requested invitation does not exist`);
      throw new BadRequestException('Requested invitation does not exist');
    }

    if (
      invitation.status === OrganizationInvitationStatus.Accepted ||
      invitation.status === OrganizationInvitationStatus.Rejected
    ) {
      this.logger.error(`Requested invitation has already been accepted or rejected`);
      throw new BadRequestException(
        'Requested invitation has already been accepted or rejected',
      );
    }

    if (user.status === OrganizationInvitationStatus.Accepted) {
      await this.userService.addToOrganization(
        userinvite.id,
        invitation.organization.id,
      );
      await this.userService.changeRole(userinvite.id, invitation.role);
      // const pre = invitation.permissionId;
      // //console.log(pre);
      // await Promise.all(
      //   pre.map(
      //     async (pre: number) =>
      //       await this.PermissionService.updatepermissionstatus(pre)),
      // );
    }

    invitation.status = user.status;

    await this.invitationRepository.save(invitation);

    return ResponseSuccess();
  }

  public async getUsersInvitation(user: ILoggedInUser, organizationId?: number, pageNumber?: number, limit?: number): Promise<{ invitations: Invitation[], currentPage: number, totalPages: number, totalCount: number }> {
    this.logger.verbose(`With in getUsersInvitation`);

    let query: SelectQueryBuilder<Invitation> = await this.invitationRepository.createQueryBuilder('invitation')
      .leftJoinAndSelect('invitation.organization', 'organization');
    if (user.role != Role.Admin) {
      query = await query
        .andWhere('organization.api_user_id = :apiUserId', { apiUserId: user.api_user_id });
    }

    if (organizationId) {
      const organization = await this.organizationService.findOne(organizationId);

      if (user.role != Role.Admin && user.role != Role.ApiUser) {
        if (user.organizationId != organizationId) {
          this.logger.error(`${user.role} can't view the invitation list of other organizations`);
          throw new BadRequestException({
            success: false,
            message: `${user.role} can't view the invitation list of other organizations`,
          });
        }
      }

      if (user.role === Role.ApiUser) {
        if (user.api_user_id != organization.api_user_id) {
          this.logger.error(`Organization ${organization.name} is part of other apiuser`);
          throw new BadRequestException({
            success: false,
            message: `Organization ${organization.name} is part of other apiuser`,
          });
        }
      }

      query = query
        .andWhere('organization.id = :organizationId', { organizationId: organizationId });
    }

    const [invitations, totalCount] = await query
      .select('invitation')
      .skip((pageNumber - 1) * limit)
      .take(limit)
      .orderBy('invitation.createdAt', 'DESC')
      .getManyAndCount();

    /*
    return this.invitationRepository.find({
      where: { email: lowerCaseEmail },
      relations: ['organization'],
    }); */
    const totalPages = Math.ceil(totalCount / limit);

    return {
      invitations: invitations,
      currentPage: pageNumber,
      totalPages,
      totalCount
    };
  }

  private ensureIsNotMember(email: string, organization: Organization) {
    this.logger.verbose(`With in ensureIsNotMember`);
    const lowerCaseEmail = email.toLowerCase();

    if (organization.users.find((u) => u.email === lowerCaseEmail)) {
      this.logger.error(`Invited user already belongs to this organization.`);
      throw new BadRequestException({
        success: false,
        error: `Invited user already belongs to this organization.`,
      });
    }
  }

  private async sendInvitation(
    organization: OrganizationDTO,
    email: string,

  ): Promise<void> {
    this.logger.verbose(`With in sendInvitation`);
    const url = `${process.env.UI_BASE_URL}/organization/invitations`;

    const result = await this.mailService.send({
      to: email,
      subject: `[Origin] Organization invitation`,
      html: `Organization <b>${organization.name}</b> has invited you to join. To accept the invitation, please visit <a href="${url}">${url}</a>
      `,
    });

    if (result) {
      this.logger.log(`Notification email sent to ${email}.`);
    }
  }
}

import { BadRequestException, Injectable, Logger, ConflictException, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ILoggedInUser,
  ISuccessResponse,
  OrganizationRole,
  ResponseSuccess,
} from '../../models';
import { UserService } from '../user/user.service';
import { OrganizationInvitationStatus } from '../../utils/enums';
import { AlreadyPartOfOrganizationError } from './errors';
import { Invitation } from './invitation.entity';
import { OrganizationService } from '../organization/organization.service';
import { Organization } from '../organization/organization.entity';
import { OrganizationDTO } from '../organization/dto';
import { MailService } from '../../mail/mail.service';
import { InviteDTO, updateInviteStatusDTO } from './dto/invite.dto';
import { CreateUserORGDTO } from '../user/dto/create-user.dto';
import { PermissionService } from '../permission/permission.service'
import { PermissionDTO, NewPermissionDTO, UpdatePermissionDTO } from '../permission/dto/modulepermission.dto'
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
    const sender = await this.userService.findByEmail(user.email);
    let inviteorg: number;
    if (user.role === 'Admin') {
      inviteorg = orgId;
    } else {
      inviteorg = user.organizationId;
    }
    const organization = await this.organizationService.findOne(
      inviteorg,
    );

    const lowerCaseEmail = email.toLowerCase();

    const invitee = await this.userService.findByEmail(lowerCaseEmail);

    if (invitee && invitee.organization) {
      throw new ConflictException({
        success: false,
        message: `User ${lowerCaseEmail} is already part of the  organization`,
      });

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
    console.log("invitee", invitee)
    //to add for if one user invite by multiple organization 
    // if (invitee) {
    //   userid = invitee

    // } else {
    userid = await this.userService.newcreate(inviteuser, UserStatus.Pending, true);

    //}
    // var updateinviteuser: updateInviteStatusDTO = {
    //   email: lowerCaseEmail,
    //   status: OrganizationInvitationStatus.Accepted
    // }

    //await this.update(updateinviteuser, saveinviteuser.id)
    await this.userService.sentinvitiontoUser(inviteuser, lowerCaseEmail, saveinviteuser.id);
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
    const lowerCaseEmail = user.email.toLowerCase();
    const userinvite = await this.userService.findByEmail(lowerCaseEmail)
    console.log(userinvite);
    const invitation = await this.invitationRepository.findOne(invitationId, {
      where: {
        email: lowerCaseEmail,
      },
      relations: ['organization'],
    });
    //console.log(invitation)
    if (!invitation) {
      throw new BadRequestException('Requested invitation does not exist');
    }

    if (
      invitation.status === OrganizationInvitationStatus.Accepted ||
      invitation.status === OrganizationInvitationStatus.Rejected
    ) {
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

  public async getUsersInvitation(email: string): Promise<Invitation[]> {
    const lowerCaseEmail = email.toLowerCase();

    return this.invitationRepository.find({
      where: { email: lowerCaseEmail },
      relations: ['organization'],
    });
  }

  private ensureIsNotMember(email: string, organization: Organization) {
    const lowerCaseEmail = email.toLowerCase();

    if (organization.users.find((u) => u.email === lowerCaseEmail)) {
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

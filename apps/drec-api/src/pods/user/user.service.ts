import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
import {
  FindOptionsWhere,
  FindManyOptions,
  Not,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import {
  ILoggedInUser,
  ISuccessResponse,
  IUser,
  UserChangePasswordUpdate,
  UserPasswordUpdate,
} from '../../models';
import {
  Role,
  UserPermissionStatus,
  UserStatus,
  OrganizationType,
} from '../../utils/enums';
import { CreateUserOrgDTO } from './dto/create-user.dto';
import { ExtendedBaseEntity } from '@energyweb/origin-backend-utils';
import { validate } from 'class-validator';
import { UserRole } from './user_role.entity';
import { UserDTO } from './dto/user.dto';
import { User } from './user.entity';
import { UpdateUserProfileDTO } from './dto/update-user-profile.dto';
import { EmailConfirmationService } from '../email-confirmation/email-confirmation.service';
import { UpdateUserDTO } from '../admin/dto/update-user.dto';
import { UserFilterDTO } from '../admin/dto/user-filter.dto';
import { OrganizationService } from '../organization/organization.service';
import { OauthClientCredentialsService } from './oauth_client.service';
import { RegistrantEntity } from './registrant.entity';
import { UserLoginSessionEntity } from './user_login_session.entity';
import { OtpService } from '../otp/otp.service';
import { MailService } from '../../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import React from 'react';
import AccountApproved from '../../mail/templates/account-approved.template';
export type TUserBaseEntity = ExtendedBaseEntity & IUser;

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(
    @InjectRepository(User) private readonly repository: Repository<User>,
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
    private readonly emailConfirmationService: EmailConfirmationService,
    private readonly oauthClientCredentialsService: OauthClientCredentialsService,
    @Inject(forwardRef(() => OrganizationService))
    private organizationService: OrganizationService,
    @InjectRepository(RegistrantEntity)
    private readonly registrantEntityRepository: Repository<RegistrantEntity>,
    @InjectRepository(UserLoginSessionEntity)
    private readonly userLoginSessionRepository: Repository<UserLoginSessionEntity>,
    private readonly otpService: OtpService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  public async seed(
    data: CreateUserOrgDTO,

    organizationId: number | null,
    role?: Role,
    status?: UserStatus,
  ): Promise<UserDTO> {
    await this.checkForExistingUser(data.email);

    return this.repository.save({
      // title: data.title,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email.toLowerCase(),
      phoneNumber: data.phoneNumber,
      password: this.hashPassword(data.password),
      role: role || Role.Admin,
      status: status || UserStatus.Active,
      organization: organizationId ? { id: organizationId } : {},
    });
  }

  // Phone number uniqueness is not enforced — multiple users may share a number
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async checkIfPhoneNumberExists(_phoneNumber: string): Promise<void> {
    return;
  }

  public async newCreateUser(
    data: CreateUserOrgDTO,
    status?: UserStatus,
    inviteUser?: boolean,
  ): Promise<UserDTO> {
    await this.checkForExistingUser(data.email.toLowerCase());
    await this.checkIfPhoneNumberExists(data.phoneNumber);
    const registrant =
      await this.oauthClientCredentialsService.findOneByApiUserId(
        data.api_user_id,
      );

    // Wrap org + user in a transaction so partial registrations leave no
    // orphan data behind.
    const user = await this.repository.manager.transaction(async (manager) => {
      let orgId;
      if (!inviteUser) {
        const organizationData = {
          name: data.orgName !== undefined ? data.orgName : '',
          organizationType: data.organizationType as OrganizationType,
          orgEmail: data.email,
          address: data.orgAddress,
        };

        organizationData['api_user_id'] = registrant.api_user_id;
        if (
          await this.organizationService.isNameAlreadyTaken(
            organizationData.name,
          )
        ) {
          throw new ConflictException({
            success: false,
            message: `Organization "${data.orgName}" already exists, please use another name`,
          });
        } else {
          const org =
            await this.organizationService.newCreateUser(organizationData);
          orgId = org.id;
          this.logger.debug(
            `Successfully registered a new organization with id ${JSON.stringify(org.id)}`,
          );
        }
      }
      if (data.orgid) {
        orgId = data.orgid;
      }
      let role: Role;
      if (data.role === Role.Reviewer || data.role === Role.SeniorReviewer) {
        role = data.role as Role;
      } else if (data.organizationType === OrganizationType.Buyer) {
        role = Role.Buyer;
      } else if (data.organizationType === OrganizationType.Registrant) {
        role = Role.Registrant;
      } else if (data.organizationType === OrganizationType.SiteOperator) {
        role = Role.SiteOperator;
      }

      const roleRecord = await this.userRoleRepository.findOne({
        where: { name: role },
      });
      const roleId = roleRecord?.id;

      const user = await manager.save(User, {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email.toLowerCase(),
        phoneNumber: data.phoneNumber,
        password: this.hashPassword(data.password),
        termsAcceptedAt: data.termsAndConditions ? new Date() : null,
        notifications: true,
        status: status || UserStatus.Pending,
        role: role,
        roleId: roleId,
        organization: orgId ? { id: orgId } : {},
        api_user_id: registrant ? registrant.api_user_id : null,
        phoneNumberVerifiedAt: null,
      } as any);
      this.logger.debug(
        `Successfully registered a new user with id ${JSON.stringify(user.id)}`,
      );

      return user;
    });

    // Email confirmation runs after the transaction commits so the user row
    // is visible to the email_confirmation FK constraint.
    await this.emailConfirmationService.create(user);
    return user;
  }

  public async createUserByAdmin(
    data: CreateUserOrgDTO,
    status?: UserStatus,
    inviteUser?: boolean,
  ): Promise<UserDTO> {
    try {
      await this.checkForExistingUser(data.email.toLowerCase());
      await this.checkIfPhoneNumberExists(data.phoneNumber);
      const admin = await this.oauthClientCredentialsService.findOneByApiUserId(
        data.api_user_id,
      );
      const isReviewer =
        data.role === Role.Reviewer ||
        data.role === Role.SeniorReviewer;
      let orgId;
      if (isReviewer) {
        // Reviewers join the admin's organization
        const adminUser = admin
          ? await this.repository.findOne({
              where: { api_user_id: admin.api_user_id },
              relations: ['organization'],
            })
          : null;
        orgId = adminUser?.organization?.id ?? null;
      } else if (!inviteUser) {
        const organizationData = {
          name: data.orgName !== undefined ? data.orgName : '',
          organizationType: data.organizationType as OrganizationType,
          orgEmail: data.email,
          address: data.orgAddress,
        };
        organizationData['api_user_id'] = admin.api_user_id;
        if (
          await this.organizationService.isNameAlreadyTaken(
            organizationData.name,
          )
        ) {
          throw new ConflictException({
            success: false,
            message: `Organization "${data.orgName}"  is already existed,please use another Organization name`,
          });
        } else {
          const org =
            await this.organizationService.newCreateUser(organizationData);
          orgId = org.id;
          this.logger.debug(
            `Successfully registered a new organization with id ${JSON.stringify(org.id)}`,
          );
        }
      }

      let role: Role;
      if (isReviewer) {
        role = data.role as Role;
      } else if (data.organizationType === OrganizationType.Buyer) {
        role = Role.Buyer;
      } else if (data.organizationType === OrganizationType.SiteOperator) {
        role = Role.SiteOperator;
      } else {
        role = Role.Registrant;
      }
      const roleRecord = await this.userRoleRepository.findOne({
        where: { name: role },
      });
      const roleId = roleRecord?.id;
      const reviewerWithInvite =
        isReviewer && data.emailNotification;

      const user = await this.repository.save({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email.toLowerCase(),
        phoneNumber: data.phoneNumber,
        password: this.hashPassword(data.password),
        notifications: true,
        status: reviewerWithInvite
          ? UserStatus.Pending
          : status || UserStatus.Active,
        role: role,
        roleId: roleId,
        organization: orgId ? { id: orgId } : {},
        api_user_id: admin ? admin.api_user_id : null,
      });
      this.logger.debug(
        `Successfully registered a new user with id ${JSON.stringify(user.id)}`,
      );

      if (reviewerWithInvite) {
        // Create email confirmation with token for password-set flow
        const emailConfirmation =
          await this.emailConfirmationService.createForReviewer(user);

        const adminUser = admin
          ? await this.repository.findOne({
              where: { api_user_id: admin.api_user_id },
            })
          : null;
        const adminName = adminUser
          ? `${adminUser.firstName} ${adminUser.lastName}`
          : 'An administrator';
        const roleName =
          role === Role.SeniorReviewer ? 'Senior Reviewer' : 'Reviewer';
        await this.emailConfirmationService.sendReviewerAddedNotification(
          user.email,
          user.firstName,
          roleName,
          adminName,
          emailConfirmation.token,
        );
      } else {
        await this.emailConfirmationService.adminCreate(user, data.password);
      }

      return new User(user);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw error;
    }
  }

  public async checkForExistingUser(email: string): Promise<void> {
    // Duplicate emails are permitted — different orgs/roles may share an email
    return;
  }

  public async getAll(options?: FindManyOptions<User>): Promise<IUser[]> {
    return this.repository.find(options);
  }

  async findById(id: number): Promise<IUser> {
    const user = await this.findOne({ id });
    if (!user) {
      throw new NotFoundException(`No user found with id ${id}`);
    }

    if (user.role === Role.Registrant) {
      const registrant = await this.getRegistrantPermissionStatus(user.api_user_id);
      user['permission_status'] = registrant.permission_status;
    }
    return user;
  }

  public async findByIds(ids: number[]): Promise<IUser[]> {
    return await this.repository.findByIds(ids);
  }

  public async findByEmail(email: string): Promise<IUser | null> {
    const lowerCaseEmail = email.toLowerCase();
    return this.findOne({ email: lowerCaseEmail });
  }

  async getUserAndPasswordByEmail(
    email: string,
  ): Promise<(Pick<UserDTO, 'id' | 'email'> & { password: string }) | null> {
    const user = await this.repository.findOne({
      where: {
        email,
      },
      select: ['id', 'email', 'password'],
    });

    return user ?? null;
  }

  async findOne(conditions: FindOptionsWhere<User>): Promise<TUserBaseEntity> {
    const user = await (this.repository.findOne({
      where: conditions,
      relations: ['organization'],
    }) as Promise<IUser> as Promise<TUserBaseEntity>);

    if (user) {
      const emailConfirmation = await this.emailConfirmationService.get(
        user.id,
      );

      user.emailConfirmed = emailConfirmation?.confirmed || false;
    }

    return user ?? null;
  }

  private hashPassword(password: string) {
    return bcrypt.hashSync(password, 8);
  }

  private async hasUser(conditions: FindOptionsWhere<User>) {
    return Boolean(await this.findOne(conditions));
  }

  async setNotifications(
    id: number,
    notifications: boolean,
  ): Promise<IUser | null> {
    await this.repository.update(id, { notifications });

    return this.findById(id);
  }

  async addToOrganization(
    userId: number,
    organizationId: number,
  ): Promise<void> {
    await this.repository.update(userId, {
      organization: { id: organizationId },
      status: UserStatus.Active,
    });
  }

  public getAnotherUserInOrganization(
    organizationId: number,
    userId: number,
  ): Promise<User[]> {
    return this.repository.find({
      where: {
        id: Not(userId),
        organization: {
          id: organizationId,
        },
      },
      order: {
        id: 'DESC',
      },
      take: 1,
    });
  }

  async removeFromOrganization(userId: number): Promise<void> {
    await this.repository.update(userId, { organization: undefined });
  }

  async remove(userId: number): Promise<void> {
    const user = await this.repository.findOne({
      where: { id: userId },
      relations: ['organization'],
    });
    await this.emailConfirmationService.remove(userId);
    await this.repository.delete(userId);

    // Clean up orphan org if this was the last user
    if (user?.organization) {
      const remainingUsers = await this.repository.count({
        where: { organization: { id: user.organization.id } },
      });
      if (remainingUsers === 0) {
        await this.organizationService.remove(user.organization.id);
      }
    }
  }

  async updateProfile(
    id: number,
    { firstName, lastName }: UpdateUserProfileDTO,
  ): Promise<ExtendedBaseEntity & IUser> {
    const updateEntity = new User({
      firstName,
      lastName,
    });

    const validationErrors = await validate(updateEntity, {
      skipUndefinedProperties: true,
    });

    if (validationErrors.length > 0) {
      throw new UnprocessableEntityException({
        success: false,
        errors: validationErrors,
      });
    }

    await this.repository.update(id, updateEntity);

    return this.findOne({ id });
  }

  async updatePassword(
    email: string,
    user: UserPasswordUpdate,
  ): Promise<ExtendedBaseEntity & IUser> {
    const userEntity = await this.getUserAndPasswordByEmail(email);

    if (
      userEntity &&
      bcrypt.compareSync(user.oldPassword, userEntity.password)
    ) {
      const updateEntity = new User({
        password: this.hashPassword(user.newPassword),
      });

      const validationErrors = await validate(updateEntity, {
        skipUndefinedProperties: true,
      });

      if (validationErrors.length > 0) {
        throw new UnprocessableEntityException({
          success: false,
          errors: validationErrors,
        });
      }

      await this.repository.update(userEntity.id, updateEntity);
      return this.findOne({ id: userEntity.id });
    }

    throw new ConflictException({
      success: false,
      errors: `Incorrect current password.`,
    });
  }
  async acceptTermsAndCondition(email: string): Promise<User> {
    const user = await this.repository.findOne({ where: { email: email } });
    if (!user) throw new NotFoundException('User not found');
    user.termsAcceptedAt = new Date();
    return await this.repository.save(user);
  }
  async changePassword(
    emailConfirmation: UserDTO,
    user: UserChangePasswordUpdate,
  ): Promise<UserDTO> {
    if (emailConfirmation) {
      const hashedPassword = this.hashPassword(user.newPassword);

      await this.repository.update(emailConfirmation.id, {
        password: hashedPassword,
      });

      // Activate the user if they were pending (e.g. reviewer setting password for the first time)
      const currentUser = await this.repository.findOne({
        where: { id: emailConfirmation.id },
      });
      if (currentUser?.status === UserStatus.Pending) {
        await this.repository.update(emailConfirmation.id, {
          status: UserStatus.Active,
        });
      }

      return emailConfirmation;
    }

    throw new ConflictException({
      success: false,
      errors: `User Not exist .`,
    });
  }

  /** Canonical role → module permissions. Used by changeRole to ensure
   *  the target role has its ACL entries when a user is assigned to it. */
  private static readonly ROLE_PERMISSIONS: Record<
    string,
    { module: string; perms: string; value: number }[]
  > = {
    Reviewer: [
      { module: 'DEVICE_MANAGEMENT_CRUDL',         perms: 'Read',                     value: 1  },
      { module: 'DEVICE_REVIEWS_MANAGEMENT_CRUDL',  perms: 'Read,Write,Update',        value: 7  },
      { module: 'USER_MANAGEMENT_CRUDL',            perms: 'Read,Write,Update',        value: 7  },
      { module: 'CHAT_MANAGEMENT_CRUDL',            perms: 'Read,Write,Update,Delete', value: 15 },
    ],
    SeniorReviewer: [
      { module: 'DEVICE_MANAGEMENT_CRUDL',         perms: 'Read',                     value: 1  },
      { module: 'DEVICE_REVIEWS_MANAGEMENT_CRUDL',  perms: 'Read,Write,Update',        value: 7  },
      { module: 'USER_MANAGEMENT_CRUDL',            perms: 'Read,Write,Update',        value: 7  },
      { module: 'CHAT_MANAGEMENT_CRUDL',            perms: 'Read,Write,Update,Delete', value: 15 },
    ],
    Registrant: [
      { module: 'USER_MANAGEMENT_CRUDL',            perms: 'Read,Write,Update,Delete', value: 15 },
      { module: 'ORGANIZATION_MANAGEMENT_CRUDL',    perms: 'Read,Write,Update,Delete', value: 15 },
      { module: 'FILE_MANAGEMENT_CRUDL',            perms: 'Read,Write,Update,Delete', value: 15 },
      { module: 'DEVICE_MANAGEMENT_CRUDL',          perms: 'Read,Write,Update,Delete', value: 15 },
      { module: 'DEVICE_GROUPING_MANAGEMENT_CRUDL', perms: 'Read,Write',               value: 3  },
      { module: 'DEVICE_BULK_MANAGEMENT_CRUDL',     perms: 'Read,Write,Update,Delete', value: 15 },
      { module: 'READS_MANAGEMENT_CRUDL',           perms: 'Read,Write,Update,Delete', value: 15 },
      { module: 'CERTIFICATE_LOG_MANAGEMENT_CRUDL', perms: 'Read',                     value: 1  },
      { module: 'INVITATION_MANAGEMENT_CRUDL',      perms: 'Read,Write,Update,Delete', value: 15 },
      { module: 'PASSWORD_MANAGEMENT_CRUDL',        perms: 'Write',                    value: 2  },
      { module: 'DEVICE_REVIEWS_MANAGEMENT_CRUDL',  perms: 'Read,Write',               value: 3  },
      { module: 'SUBMISSION_MANAGEMENT_CRUDL',      perms: 'Read,Write,Update,Delete', value: 15 },
      { module: 'CHAT_MANAGEMENT_CRUDL',            perms: 'Read,Write',               value: 3  },
    ],
    Buyer: [
      { module: 'USER_MANAGEMENT_CRUDL',            perms: 'Read,Write,Update',        value: 7  },
      { module: 'ORGANIZATION_MANAGEMENT_CRUDL',    perms: 'Read',                     value: 1  },
      { module: 'DEVICE_GROUPING_MANAGEMENT_CRUDL', perms: 'Read',                     value: 1  },
      { module: 'CERTIFICATE_LOG_MANAGEMENT_CRUDL', perms: 'Read',                     value: 1  },
      { module: 'INVITATION_MANAGEMENT_CRUDL',      perms: 'Read,Write,Update,Delete', value: 15 },
      { module: 'PASSWORD_MANAGEMENT_CRUDL',        perms: 'Write',                    value: 2  },
      { module: 'CHAT_MANAGEMENT_CRUDL',            perms: 'Read,Write',               value: 3  },
    ],
    SubBuyer: [
      { module: 'DEVICE_GROUPING_MANAGEMENT_CRUDL', perms: 'Read,Write',               value: 3  },
      { module: 'CERTIFICATE_LOG_MANAGEMENT_CRUDL', perms: 'Read',                     value: 1  },
      { module: 'INVITATION_MANAGEMENT_CRUDL',      perms: 'Read,Write,Update,Delete', value: 15 },
      { module: 'PASSWORD_MANAGEMENT_CRUDL',        perms: 'Write',                    value: 2  },
      { module: 'CHAT_MANAGEMENT_CRUDL',            perms: 'Read,Write',               value: 3  },
    ],
    SiteOperator: [
      { module: 'USER_MANAGEMENT_CRUDL',            perms: 'Read,Write,Update',        value: 7  },
      { module: 'ORGANIZATION_MANAGEMENT_CRUDL',    perms: 'Read,Write,Update,Delete', value: 15 },
      { module: 'FILE_MANAGEMENT_CRUDL',            perms: 'Read,Write,Update,Delete', value: 15 },
      { module: 'DEVICE_MANAGEMENT_CRUDL',          perms: 'Read,Write,Update,Delete', value: 15 },
      { module: 'DEVICE_GROUPING_MANAGEMENT_CRUDL', perms: 'Read,Write,Update,Delete', value: 15 },
      { module: 'DEVICE_BULK_MANAGEMENT_CRUDL',     perms: 'Read,Write,Update,Delete', value: 15 },
      { module: 'READS_MANAGEMENT_CRUDL',           perms: 'Read,Write,Update,Delete', value: 15 },
      { module: 'CERTIFICATE_LOG_MANAGEMENT_CRUDL', perms: 'Read',                     value: 1  },
      { module: 'INVITATION_MANAGEMENT_CRUDL',      perms: 'Read,Write,Update,Delete', value: 15 },
      { module: 'PASSWORD_MANAGEMENT_CRUDL',        perms: 'Write',                    value: 2  },
      { module: 'SUBMISSION_MANAGEMENT_CRUDL',      perms: 'Read,Write',               value: 3  },
      { module: 'DEVICE_REVIEWS_MANAGEMENT_CRUDL',  perms: 'Read,Write,Update',        value: 7  },
      { module: 'CHAT_MANAGEMENT_CRUDL',            perms: 'Read,Write',               value: 3  },
    ],
  };

  public async changeRole(
    userId: number,
    role: Role,
  ): Promise<ExtendedBaseEntity & IUser> {
    this.logger.log(`Changing user role for userId=${userId} to ${role}`);
    const userRole = await this.userRoleRepository.findOne({
      where: {
        name: role,
      },
    });
    await this.repository.update(userId, { role, roleId: userRole.id });

    // Ensure the role has its ACL permission entries
    await this.ensureRolePermissions(role, userRole.id);

    return this.findOne({ id: userId });
  }

  /** Insert any missing role-level ACL permissions for the given role. */
  private async ensureRolePermissions(
    role: Role,
    roleId: number,
  ): Promise<void> {
    const perms = UserService.ROLE_PERMISSIONS[role];
    if (!perms) return; // Admin or unknown role — nothing to provision

    const mgr = this.repository.manager;
    for (const p of perms) {
      await mgr.query(
        `INSERT INTO "aclmodulepermissions"
           ("aclmodulesId", "entityType", "entityId", "permissions", "permissionValue", "status")
         SELECT a.id, 'Role', $1, $2, $3, 1
         FROM "aclmodules" a
         WHERE a.name = $4
           AND NOT EXISTS (
             SELECT 1 FROM "aclmodulepermissions" ep
             WHERE ep."aclmodulesId" = a.id
               AND ep."entityType" = 'Role'
               AND ep."entityId" = $1
               AND ep."permissions" = $2
           )`,
        [roleId, p.perms, p.value, p.module],
      );
    }
  }

  async getPlatformAdmin(): Promise<IUser | undefined> {
    return this.findOne({ role: Role.Admin });
  }

  public async getUsersByFilter(
    filterDTO: UserFilterDTO,
    pageNumber: number,
    limit: number,
  ): Promise<{
    users: IUser[];
    currentPage: number;
    totalPages: number;
    totalCount: number;
  }> {
    const query = await this.getFilteredQuery(filterDTO);
    try {
      const [users, totalCount] = await query
        .skip((pageNumber - 1) * limit)
        .take(limit)
        .getManyAndCount();
      const totalPages = Math.ceil(totalCount / limit);

      const userIds = users.map((u) => u.id);
      if (userIds.length) {
        const lastUsedRows = await this.userLoginSessionRepository
          .createQueryBuilder('s')
          .select('s.userId', 'userId')
          .addSelect('MAX(s.updatedAt)', 'lastUsed')
          .where('s.userId IN (:...userIds)', { userIds })
          .groupBy('s.userId')
          .getRawMany<{ userId: number; lastUsed: Date }>();
        const lastUsedMap = new Map(
          lastUsedRows.map((r) => [Number(r.userId), r.lastUsed]),
        );
        for (const u of users) {
          (u as unknown as { lastUsed: Date | null }).lastUsed =
            lastUsedMap.get(u.id) ?? null;
        }
      }

      return {
        users: users,
        currentPage: pageNumber,
        totalPages,
        totalCount,
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve users`, error.stack);
      throw new InternalServerErrorException('Failed to retrieve users');
    }
  }

  private getFilteredQuery(filterDTO: UserFilterDTO): SelectQueryBuilder<User> {
    const { organizationName, status } = filterDTO;
    const query = this.repository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.organization', 'organization')
      .orderBy('user.createdAt', 'DESC');
    if (organizationName) {
      const baseQuery = 'organization.name ILIKE :organizationName';
      query.andWhere(baseQuery, { organizationName: `%${organizationName}%` });
    }
    if (status) {
      query.andWhere(`user.status = '${status}'`);
    }
    return query;
  }

  async update(
    id: number,
    data: UpdateUserDTO,
  ): Promise<ExtendedBaseEntity & IUser> {
    const roleValue = data.role;
    data = new User({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      status: data.status,
    });
    const validationErrors = await validate(data, {
      skipUndefinedProperties: true,
    });
    if (validationErrors.length > 0) {
      throw new UnprocessableEntityException({
        success: false,
        errors: validationErrors,
      });
    }

    const updateUser = await this.findById(id);
    if (!(updateUser.email === data.email)) {
      await this.checkForExistingUser(data.email);
    }

    const updatePayload: any = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      status: data.status,
    };
    if (roleValue) {
      updatePayload.role = roleValue;
    }
    const previousStatus = updateUser.status;
    await this.repository.update(id, updatePayload);

    // Send approval email when status changes from Pending to Active
    if (
      previousStatus === UserStatus.Pending &&
      data.status === UserStatus.Active
    ) {
      const loginUrl =
        this.configService.get<string>('UI_BASE_URL') || 'https://portal.drecs.org';
      this.mailService
        .send({
          to: updateUser.email,
          subject: 'Your D-REC account has been approved',
          template: React.createElement(AccountApproved, {
            firstName: updateUser.firstName,
            loginUrl: `${loginUrl}/login`,
          }),
        })
        .catch((err) =>
          this.logger.error(`Failed to send approval email to ${updateUser.email}`, err),
        );
    }

    return this.findOne({ id });
  }

  public async canViewUserData(
    userId: IUser['id'],
    loggedInUser: ILoggedInUser,
  ): Promise<IUser> {
    const user = await this.findById(userId);

    const isOwnUser = loggedInUser.id === userId;
    const isOrgAdmin =
      loggedInUser.organizationId === user.organization?.id &&
      loggedInUser.hasRole(Role.Registrant);
    const isAdmin = loggedInUser.hasRole(Role.Admin);

    const canViewUserData = isOwnUser || isOrgAdmin || isAdmin;

    if (!canViewUserData) {
      throw new UnauthorizedException({
        success: false,
        message: `Unable to fetch user data. Unauthorized.`,
      });
    }
    if (user.role === Role.Registrant) {
      const registrant = await this.getRegistrantPermissionStatus(user.api_user_id);
      user['permission_status'] = registrant.permission_status;
    }
    return user;
  }

  public async getTokenForResetPassword(
    email: string,
  ): Promise<ISuccessResponse> {
    return await this.emailConfirmationService.confirmationEmailForResetPassword(
      email,
    );
  }

  public async sendUserInvitation(
    inviteUser: CreateUserOrgDTO,
    email: string,
  ): Promise<{
    message: string;
    success: boolean;
  }> {
    const currentToken = await this.emailConfirmationService.getByEmail(email);
    if (!currentToken) {
      return {
        message: 'Token not found',
        success: false,
      };
    }
    const { id } = currentToken;
    await this.emailConfirmationService.generateToken(currentToken, id);
    await this.emailConfirmationService.sendInvitation(inviteUser, email);
  }

  public async findUserByOrganization(
    organizationId: number,
    pageNumber: number,
    limit: number,
  ): Promise<any> {
    return await this.repository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.organization', 'organization')
      .where('organization.id = :organizationId', { organizationId })
      .orderBy('user.createdAt', 'DESC')
      .skip((pageNumber - 1) * limit)
      .take(limit)
      .getManyAndCount();
  }
  /**get all user of registrant */
  public async findUserByApiUserId(
    api_user_id: string,
    pageNumber: number,
    limit: number,
  ): Promise<any> {
    return await this.repository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.organization', 'organization')
      .where('user.api_user_id = :api_user_id', { api_user_id })
      .andWhere(`role != :role`, { role: Role.Registrant })
      .orderBy('user.createdAt', 'DESC')
      .skip((pageNumber - 1) * limit)
      .take(limit)
      .getManyAndCount();
  }
  /** Registrant Fuction*/

  async getRegistrant(api_id: string): Promise<RegistrantEntity | undefined> {
    return await this.registrantEntityRepository.findOne({
      where: {
        api_user_id: api_id,
      },
    });
  }
  /**
   * This Function added for request of permission to registrant in registrant table
   * @param api_id
   * @param permissionIds
   */
  async registrantPermissionRequest(
    api_id: string,
    permissionIds: number[] | any,
  ): Promise<void> {
    await this.registrantEntityRepository.update(api_id, {
      permissionIds: permissionIds,
      permission_status: UserPermissionStatus.Request,
    });
  }
  async registrantPermissionAcceptedByAdmin(
    api_id: string,
    status: UserPermissionStatus,
  ): Promise<any> {
    await this.registrantEntityRepository.update(api_id, {
      permission_status: status,
    });
    return await this.registrantEntityRepository.findOne({
      where: {
        api_user_id: api_id,
      },
    });
  }
  /**
   * This service method use for get info of permission request status(Request,Active and Deactive)
   * @param apiId
   * @returns
   */
  async getRegistrantPermissionStatus(apiId: string): Promise<any> {
    return await this.registrantEntityRepository.findOne({
      where: {
        api_user_id: apiId,
      },
    });
  }

  /**
   * this function create for get user list of Registrant
   * @param organizationName
   * @param pageNumber
   * @param limit
   * @returns
   */
  public async getRegistrants(
    organizationName: string,
    pageNumber: number,
    limit: number,
  ): Promise<{
    users: IUser[];
    currentPage: number;
    totalPages: number;
    totalCount: number;
  }> {
    const filterDTO = new UserFilterDTO();
    filterDTO.organizationName = organizationName;
    const query = await this.getFilteredQuery(filterDTO);
    try {
      const [registrants, totalCount] = await query
        .andWhere(`user.role = :role`, { role: Role.Registrant })
        .skip((pageNumber - 1) * limit)
        .take(limit)
        .getManyAndCount();

      const totalPages = Math.ceil(totalCount / limit);
      return {
        users: registrants,
        currentPage: pageNumber,
        totalPages,
        totalCount,
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve registrants`, error.stack);
      throw new InternalServerErrorException('Failed to retrieve registrants');
    }
  }

  /**
   *
   * @param email
   * @param token
   * @returns
   */

  async createUserSession(
    user: Omit<IUser, 'password'>,
    token: string,
  ): Promise<void> {
    await this.userLoginSessionRepository.save({
      userId: user.id,
      accesstoken_hash: token,
    });
    return;
  }
  /**
   *
   * @param userId
   * @returns
   */
  async removeUserSession(userId: number, token: string): Promise<any> {
    return await this.userLoginSessionRepository.delete({
      userId: userId,
      accesstoken_hash: token.trim(),
    });
  }

  async hasValidUserSession(
    conditions: FindOptionsWhere<UserLoginSessionEntity>,
  ): Promise<boolean> {
    return Boolean(
      await this.userLoginSessionRepository.findOne({ where: conditions }),
    );
  }

  async verifyEmail(userId: number): Promise<User> {
    this.logger.verbose(`Updating emailVerifiedAt for user ${userId}`);

    await this.repository.update(
      { id: userId },
      { emailVerifiedAt: new Date() },
    );

    return this.repository.findOne({ where: { id: userId } });
  }

  async updatePhoneNumber(
    email: string,
    phoneNumber: string,
  ): Promise<{ message: string }> {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.checkIfPhoneNumberExists(phoneNumber);

    const updateEntity = new User({
      phoneNumber: phoneNumber,
    });

    const validationErrors = await validate(updateEntity, {
      skipUndefinedProperties: true,
    });

    if (validationErrors.length > 0) {
      throw new UnprocessableEntityException({
        success: false,
        errors: validationErrors,
      });
    }

    await this.repository.update(user.id, updateEntity);

    await this.otpService.send(phoneNumber);

    return { message: 'Phone number updated successfully' };
  }
}

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
  FindConditions,
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
import { ApiUserEntity } from './api-user.entity';
import { UserLoginSessionEntity } from './user_login_session.entity';
import { JwtService } from '@nestjs/jwt';
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
    @InjectRepository(ApiUserEntity)
    private readonly apiUserEntityRepository: Repository<ApiUserEntity>,
    @InjectRepository(UserLoginSessionEntity)
    private readonly userLoginSessionRepository: Repository<UserLoginSessionEntity>,
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

  public async checkIfPhoneNumberExists(phoneNumber: string): Promise<void> {
    const existingTelephone = await this.repository.findOne({
      where: { phoneNumber },
    });

    if (existingTelephone) {
      throw new ConflictException({
        success: false,
        message:
          'This phone number is already registered. Please use a different phone number.',
      });
    }
  }

  public async newCreateUser(
    data: CreateUserOrgDTO,
    status?: UserStatus,
    inviteUser?: boolean,
  ): Promise<UserDTO> {
    try {
      await this.checkForExistingUser(data.email.toLowerCase());
      await this.checkIfPhoneNumberExists(data.phoneNumber);
      const apiUser =
        await this.oauthClientCredentialsService.findOneByApiUserId(
          data.api_user_id,
        );

      let orgId;
      if (!inviteUser) {
        const organizationData = {
          name: data.orgName !== undefined ? data.orgName : '',
          organizationType: data.organizationType as OrganizationType,
          orgEmail: data.email,
          address: data.orgAddress,
        };

        organizationData['api_user_id'] = apiUser.api_user_id;
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
      if (data.orgid) {
        orgId = data.orgid;
      }
      let role;
      let roleId;
      if (data.organizationType === OrganizationType.Buyer) {
        role = Role.Buyer;
        roleId = 4;
      } else if (data.organizationType === OrganizationType.Developer) {
        role = Role.OrganizationAdmin;
        roleId = 2;
      } else if (data.organizationType === OrganizationType.ApiUser) {
        role = Role.ApiUser;
        roleId = 6;
      }

      const user = await this.repository.save({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email.toLowerCase(),
        phoneNumber: data.phoneNumber,
        password: this.hashPassword(data.password),
        termsAcceptedAt: data.termsAndConditions ? new Date() : null,
        notifications: true,
        status: status || UserStatus.Active,
        role: role,
        roleId: roleId,
        organization: orgId ? { id: orgId } : {},
        api_user_id: apiUser ? apiUser.api_user_id : null,
        phoneNumberVerifiedAt: null,
      });
      const { ...userData } = user;
      this.logger.debug(
        `Successfully registered a new user with id ${JSON.stringify(userData.id)}`,
      );
      await this.emailConfirmationService.create(user);
      return user;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw error;
    }
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
      let orgId;
      if (!inviteUser) {
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

      let role;
      let roleId;
      if (data.organizationType === OrganizationType.Buyer) {
        role = Role.Buyer;
        roleId = 4;
      } else {
        role = Role.OrganizationAdmin;
        roleId = 2;
      }
      const user = await this.repository.save({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email.toLowerCase(),
        phoneNumber: data.phoneNumber,
        password: this.hashPassword(data.password),
        notifications: true,
        status: status || UserStatus.Active,
        role: role,
        roleId: roleId,
        organization: orgId ? { id: orgId } : {},
        api_user_id: admin ? admin.api_user_id : null,
      });
      const { ...userData } = user;
      this.logger.debug(
        `Successfully registered a new user with id ${JSON.stringify(userData.id)}`,
      );
      await this.emailConfirmationService.adminCreate(user, data.password);

      return new User(user);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw error;
    }
  }

  public async checkForExistingUser(email: string): Promise<void> {
    const isExistingUser = await this.hasUser({ email });

    if (isExistingUser) {
      const message = `User with email ${email} already exists`;

      this.logger.error(message);
      throw new ConflictException({
        success: false,
        message,
      });
    }
  }

  public async getAll(options?: FindManyOptions<User>): Promise<IUser[]> {
    return this.repository.find(options);
  }

  async findById(id: number): Promise<IUser> {
    const user = await this.findOne({ id });
    if (!user) {
      throw new NotFoundException(`No user found with id ${id}`);
    }

    if (user.role === Role.ApiUser) {
      const apiUser = await this.getApiUserPermissionStatus(user.api_user_id);
      user['permission_status'] = apiUser.permission_status;
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

  async findOne(conditions: FindConditions<User>): Promise<TUserBaseEntity> {
    const user = await (this.repository.findOne(conditions, {
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

  private async hasUser(conditions: FindConditions<User>) {
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
    await this.emailConfirmationService.remove(userId);
    await this.repository.delete(userId);
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

      await this.repository.update(emailConfirmation.id, updateEntity);
      return emailConfirmation;
    }

    throw new ConflictException({
      success: false,
      errors: `User Not exist .`,
    });
  }

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
    return this.findOne({ id: userId });
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
        .andWhere(`role != :role`, { role: Role.ApiUser })
        .skip((pageNumber - 1) * limit)
        .take(limit)
        .getManyAndCount();
      const totalPages = Math.ceil(totalCount / limit);

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

    await this.repository.update(id, {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      status: data.status,
    });

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
      loggedInUser.hasRole(Role.OrganizationAdmin);
    const isAdmin = loggedInUser.hasRole(Role.Admin);

    const canViewUserData = isOwnUser || isOrgAdmin || isAdmin;

    if (!canViewUserData) {
      throw new UnauthorizedException({
        success: false,
        message: `Unable to fetch user data. Unauthorized.`,
      });
    }
    if (user.role === Role.ApiUser) {
      const apiUser = await this.getApiUserPermissionStatus(user.api_user_id);
      user['permission_status'] = apiUser.permission_status;
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
  /**get all user of apiuser */
  public async findUserByApiUserId(
    api_user_id: string,
    pageNumber: number,
    limit: number,
  ): Promise<any> {
    return await this.repository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.organization', 'organization')
      .where('user.api_user_id = :api_user_id', { api_user_id })
      .andWhere(`role != :role`, { role: Role.ApiUser })
      .orderBy('user.createdAt', 'DESC')
      .skip((pageNumber - 1) * limit)
      .take(limit)
      .getManyAndCount();
  }
  /** ApiUser Fuction*/

  async getApiUser(api_id: string): Promise<ApiUserEntity | undefined> {
    return await this.apiUserEntityRepository.findOne({
      where: {
        api_user_id: api_id,
      },
    });
  }
  /**
   * This Function added for request of permission to apiuser in apiuser table
   * @param api_id
   * @param permissionIds
   */
  async apiUserPermissionRequest(
    api_id: string,
    permissionIds: number[] | any,
  ): Promise<void> {
    await this.apiUserEntityRepository.update(api_id, {
      permissionIds: permissionIds,
      permission_status: UserPermissionStatus.Request,
    });
  }
  async apiUserPermissionAcceptedByAdmin(
    api_id: string,
    status: UserPermissionStatus,
  ): Promise<any> {
    await this.apiUserEntityRepository.update(api_id, {
      permission_status: status,
    });
    return await this.apiUserEntityRepository.findOne({
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
  async getApiUserPermissionStatus(apiId: string): Promise<any> {
    return await this.apiUserEntityRepository.findOne({
      where: {
        api_user_id: apiId,
      },
    });
  }

  /**
   * this function create for get user list of ApiUser
   * @param organizationName
   * @param pageNumber
   * @param limit
   * @returns
   */
  public async getApiUsers(
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
      const [apiUsers, totalCount] = await query
        .andWhere(`user.role = :role`, { role: Role.ApiUser })
        .skip((pageNumber - 1) * limit)
        .take(limit)
        .getManyAndCount();

      const totalPages = Math.ceil(totalCount / limit);
      return {
        users: apiUsers,
        currentPage: pageNumber,
        totalPages,
        totalCount,
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve apiUsers`, error.stack);
      throw new InternalServerErrorException('Failed to retrieve apiUsers');
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
    conditions: FindConditions<UserLoginSessionEntity>,
  ): Promise<boolean> {
    return Boolean(await this.userLoginSessionRepository.findOne(conditions));
  }

  async verifyEmail(userId: number): Promise<User> {
    this.logger.verbose(`Updating emailVerifiedAt for user ${userId}`);

    await this.repository.update(
      { id: userId },
      { emailVerifiedAt: new Date() },
    );

    return this.repository.findOne({ id: userId });
  }
}

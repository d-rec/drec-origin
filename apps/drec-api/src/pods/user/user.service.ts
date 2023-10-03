import {
  ConflictException,
  Injectable,
  Inject,
  Logger,
  UnprocessableEntityException,
  UnauthorizedException,
  NotFoundException,
  InternalServerErrorException,
  forwardRef
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
import {
  FindConditions,
  Repository,
  FindManyOptions,
  SelectQueryBuilder,
} from 'typeorm';
import { ILoggedInUser, IUser, UserPasswordUpdate, UserChangePasswordUpdate } from '../../models';
import { Role, UserStatus } from '../../utils/enums';
import { CreateUserORGDTO } from './dto/create-user.dto';
import { ExtendedBaseEntity } from '@energyweb/origin-backend-utils';
import { validate } from 'class-validator';

import { UserDTO } from './dto/user.dto';
import { User } from './user.entity';
import { UpdateUserProfileDTO } from './dto/update-user-profile.dto';
import { EmailConfirmationService } from '../email-confirmation/email-confirmation.service';
import { UpdateUserDTO } from '../admin/dto/update-user.dto';
import { UserFilterDTO } from '../admin/dto/user-filter.dto';
import { OrganizationService } from '../organization/organization.service';
import { IEmailConfirmationToken } from '../../models';
import { OauthClientCredentialsService } from './oauth_client.service';
export type TUserBaseEntity = ExtendedBaseEntity & IUser;

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User) private readonly repository: Repository<User>,
    private readonly emailConfirmationService: EmailConfirmationService,
    private readonly oauthClientCredentialsService: OauthClientCredentialsService,
    @Inject(forwardRef(() => OrganizationService)) private organizationService: OrganizationService,
  ) { }

  public async seed(
    data: CreateUserORGDTO,

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
      // telephone: data.telephone,
      password: this.hashPassword(data.password),
      role: role || Role.Admin,
      status: status || UserStatus.Active,
      organization: organizationId ? { id: organizationId } : {},
    });
  }

  // public async create(data: CreateUserDTO): Promise<UserDTO> {
  //   await this.checkForExistingUser(data.email);
  //   const user = await this.repository.save({
  //     title: data.title,
  //     firstName: data.firstName,
  //     lastName: data.lastName,
  //     email: data.email.toLowerCase(),
  //     telephone: data.telephone,
  //     password: this.hashPassword(data.password),
  //     notifications: true,
  //     status: UserStatus.Pending,
  //     role: Role.OrganizationAdmin,
  //   });

  //   await this.emailConfirmationService.create(user);

  //   return new User(user);
  // }
  public async newcreate(data: CreateUserORGDTO,
    status?: UserStatus, inviteuser?: Boolean): Promise<UserDTO> {
    console.log(data['client']);
    await this.checkForExistingUser(data.email);
    let api_user: any;
    if (data.organizationType.toLowerCase() == 'ApiUser'.toLowerCase()) {
      console.log("came here iasjdajsdojsdojasd");
      api_user = await this.oauthClientCredentialsService.createAPIUser();
      console.log("api_user", api_user);
    }
    var org_id;
    // if (data.secretKey != null) {
    const orgdata = {
      name: data.orgName !== undefined ? data.orgName : '',
      organizationType: data.organizationType,
      // secretKey: data.secretKey,
      orgEmail: data.email,
      address: data.orgAddress

    }
    if (data.organizationType.toLowerCase() == 'ApiUser'.toLowerCase()) {
      orgdata['api_user_id'] = api_user.api_user_id;
    }
    else if (data['client']) {
      orgdata['api_user_id'] = data['client'].api_user_id;
    }

    if (await this.organizationService.isNameAlreadyTaken(orgdata.name)) {
      throw new ConflictException({
        success: false,
        message: `Organization "${data.orgName}"  is already existed,please use another Organization name`,
      });

    } else {

      const org = await this.organizationService.newcreate(orgdata)
      org_id = org.id;
      this.logger.debug(
        `Successfully registered a new organization with id ${JSON.stringify(org)}`,
      );


    }

    //  }
    this.logger.debug(
      `Successfully registered a new organization with id ${org_id}`,
    );
    var role;
    var roleId;
    if (data.organizationType === 'Buyer' || data.organizationType === 'buyer') {
      role = Role.Buyer
      roleId = 4;
    } else if (data.organizationType === 'Developer' || data.organizationType === 'Developer') {
      role = Role.OrganizationAdmin
      roleId = 2;
    } else if (data.organizationType === 'ApiUser' || data.organizationType === 'apiuser') {
      role = Role.ApiUser
      roleId = 6;
    }
    console.log(role, "151", roleId)
    const user = await this.repository.save({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email.toLowerCase(),
      password: this.hashPassword(data.password),
      notifications: true,
      status: status || UserStatus.Active,
      role: role,
      roleId: roleId,
      organization: org_id ? { id: org_id } : {},
      api_user_id: api_user ? api_user.api_user_id : data['client'] ? data['client'].api_user_id : null

    });
    this.logger.debug(
      `Successfully registered a new organization with id ${JSON.stringify(user)}`,
    );
    if (inviteuser) {
      await this.emailConfirmationService.create(user, true);
    } else {
      await this.emailConfirmationService.create(user, false);
    }
    if (api_user) {
      let clienCredentialsData = this.oauthClientCredentialsService.generateClientCredentials();
      this.oauthClientCredentialsService.store(clienCredentialsData.client_id, clienCredentialsData.client_secret, api_user.api_user_id);
      let newUser = new User(user);
      newUser['client_id'] = clienCredentialsData.client_id;
      newUser['client_secret'] = clienCredentialsData.client_secret;
      return newUser;
    }

    return new User(user);
  }

  private async checkForExistingUser(email: string): Promise<void> {
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

  async validateClient(client_id, client_secret) {
    console.log(client_id);
    console.log(client_secret);
    // this.oauthClientCredentialsService.findOneByclient_id
    const client = await this.oauthClientCredentialsService.findOneByclient_id(client_id);
    if (!client) {
      throw new UnauthorizedException('Invalid client credentials');
    }
    client.client_secret = this.oauthClientCredentialsService.decryptclient_secret(client.client_secret);
    console.log("client.client_secret", client.client_secret);
    console.log("clientSecret", client_secret);
    if (client.client_secret !== client_secret) {
      throw new UnauthorizedException('Invalid client credentials');
    }
    return client;
  }


  public async getAll(options?: FindManyOptions<User>): Promise<IUser[]> {
    return this.repository.find(options);
  }

  async findById(id: number): Promise<IUser> {
    const user = this.findOne({ id });
    if (!user) {
      throw new NotFoundException(`No user found with id ${id}`);
    }
    return user;
  }

  public async findByIds(ids: number[]): Promise<IUser[]> {
    return await this.repository.findByIds(ids);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    const lowerCaseEmail = email.toLowerCase();

    return this.findOne({ email: lowerCaseEmail });
  }

  async getUserAndPasswordByEmail(
    email: string,
  ): Promise<(Pick<UserDTO, 'id' | 'email'> & { password: string }) | null> {
    const user = await this.repository.findOne(
      { email },
      {
        select: ['id', 'email', 'password'],
      },
    );

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
      status: UserStatus.Active
    });
  }

  async removeFromOrganization(userId: number): Promise<void> {
    await this.repository.update(userId, { organization: undefined });
  }

  async updateProfile(
    id: number,
    { firstName, lastName, email }: UpdateUserProfileDTO,
  ): Promise<ExtendedBaseEntity & IUser> {
    const updateEntity = new User({

      firstName,
      lastName,
      email,

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
    const _user = await this.getUserAndPasswordByEmail(email);

    if (_user && bcrypt.compareSync(user.oldPassword, _user.password)) {
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

      await this.repository.update(_user.id, updateEntity);
      return this.findOne({ id: _user.id });
    }

    throw new ConflictException({
      success: false,
      errors: `Incorrect current password.`,
    });
  }


  async updatechangePassword(
    token: IEmailConfirmationToken['token'],
    user: UserChangePasswordUpdate,
  ): Promise<ExtendedBaseEntity & IUser> {
    const emailConfirmation = await this.emailConfirmationService.findOne({ token });
    console.log("emailConfirmation")
    console.log(emailConfirmation)

    //const _user = await this.findById(emailConfirmation.id);
    console.log(emailConfirmation)
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

      await this.repository.update(emailConfirmation.user.id, updateEntity);
      return emailConfirmation.user;

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
    var roleId;
    if (role === Role.DeviceOwner) {
      roleId = 3
    } else {
      roleId = 5
    }
    await this.repository.update(userId, { role, roleId });
    return this.findOne({ id: userId });
  }


  async getPlatformAdmin(): Promise<IUser | undefined> {
    return this.findOne({ role: Role.Admin });
  }

  public async getUsersByFilter(filterDto: UserFilterDTO): Promise<IUser[]> {
    const query = this.getFilteredQuery(filterDto);
    try {
      const users = await query.getMany();
      return users;
    } catch (error) {
      this.logger.error(`Failed to retrieve users`, error.stack);
      throw new InternalServerErrorException('Failed to retrieve users');
    }
  }

  private getFilteredQuery(filterDto: UserFilterDTO): SelectQueryBuilder<User> {
    const { organizationName, status } = filterDto;
    const query = this.repository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.organization', 'organization');
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
    await this.findById(id);
    const validationErrors = await validate(data, {
      skipUndefinedProperties: true,
    });

    if (validationErrors.length > 0) {
      throw new UnprocessableEntityException({
        success: false,
        errors: validationErrors,
      });
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

    return user;
  }
}

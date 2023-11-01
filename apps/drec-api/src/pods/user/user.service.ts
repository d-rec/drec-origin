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
  Not
} from 'typeorm';
import { ILoggedInUser, IUser, UserPasswordUpdate, UserChangePasswordUpdate } from '../../models';
import { Role, UserStatus, UserPermissionStatus } from '../../utils/enums';
import { CreateUserORGDTO } from './dto/create-user.dto';
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
import { IEmailConfirmationToken, ISuccessResponse } from '../../models';
import { OauthClientCredentialsService } from './oauth_client.service';
export type TUserBaseEntity = ExtendedBaseEntity & IUser;
import { ApiUserEntity } from './api-user.entity';
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User) private readonly repository: Repository<User>,
    @InjectRepository(UserRole) private rolerepository: Repository<UserRole>,
    private readonly emailConfirmationService: EmailConfirmationService,
    private readonly oauthClientCredentialsService: OauthClientCredentialsService,
    @Inject(forwardRef(() => OrganizationService)) private organizationService: OrganizationService,
    @InjectRepository(ApiUserEntity)
    private readonly apiUserEntityRepository: Repository<ApiUserEntity>,

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
    await this.checkForExistingUser(data.email.toLowerCase());
    //@ts-ignore
    let api_user = await this.oauthClientCredentialsService.findOneByApiUserId(data.client.api_user_id);
    console.log("ApiUserId at UserService:",api_user);
    /*
    if (data.organizationType.toLowerCase() == 'ApiUser'.toLowerCase()) {
      console.log("came here iasjdajsdojsdojasd");
      api_user = await this.oauthClientCredentialsService.createAPIUser();
      console.log("api_user", api_user);
    } */
    var org_id;
    if (!inviteuser) {
      const orgdata = {
        name: data.orgName !== undefined ? data.orgName : '',
        organizationType: data.organizationType,
        // secretKey: data.secretKey,
        orgEmail: data.email,
        address: data.orgAddress

      }

      orgdata['api_user_id'] = data['client'].api_user_id;

    /*
      if (data.organizationType.toLowerCase() == 'ApiUser'.toLowerCase()) {
        orgdata['api_user_id'] = api_user.api_user_id;
      }
      else if (data['client']) {
        orgdata['api_user_id'] = data['client'].api_user_id;
      }
    */
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

    }
    //@ts-ignore
    if (data.orgid) {
      //@ts-ignore
      org_id = data.orgid;
    }
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
      `Successfully registered a new user with id ${JSON.stringify(user)}`,
    );
    // if (inviteuser) {
    //   await this.emailConfirmationService.create(user, data.orgName, true);
    // } else {
    // }
    /*
    if (api_user) {
      let clienCredentialsData = await this.oauthClientCredentialsService.generateClientCredentials();
      await this.oauthClientCredentialsService.store(clienCredentialsData.client_id, clienCredentialsData.client_secret, api_user.api_user_id);
      let newUser = new User(user);
      newUser['client_id'] = clienCredentialsData.client_id;
      newUser['client_secret'] = clienCredentialsData.client_secret;
      await this.emailConfirmationService.create(user);
      return newUser;
    }
    */
    if (data.organizationType === 'ApiUser' || data.organizationType === 'apiuser') {
      //@ts-ignore
      user['client_id'] = data.client.client_id;
      //@ts-ignore
      user['client_secret'] = data.client.client_secret;
    }   

    await this.emailConfirmationService.create(user);
    //return new User(user);
    return user;
  }

  public async adminnewcreate(data: CreateUserORGDTO,
    status?: UserStatus, inviteuser?: Boolean): Promise<UserDTO> {
    await this.checkForExistingUser(data.email.toLowerCase());
    var org_id;
    if (!inviteuser) {
      const orgdata = {
        name: data.orgName !== undefined ? data.orgName : '',
        organizationType: data.organizationType,
        // secretKey: data.secretKey,
        orgEmail: data.email,
        address: data.orgAddress

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
    }

    var role;
    var roleId;
    if (data.organizationType === 'Buyer' || data.organizationType === 'buyer') {
      role = Role.Buyer
      roleId = 4;
    } else {
      role = Role.OrganizationAdmin
      roleId = 2;
    }

    // const getrole = await this.rolerepository.findOne({ name: role })
    // console.log(getrole);

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

    });
    this.logger.debug(
      `Successfully registered a new user with id ${JSON.stringify(user)}`,
    );
    // if (inviteuser) {
    //   await this.emailConfirmationService.create(user, data.orgName, true);
    // } else {
    await this.emailConfirmationService.admincreate(user, data.password);
    // }

    return new User(user);
  }

  private async checkForExistingUser(email: string): Promise<void> {
    console.log(email);
    const isExistingUser = await this.hasUser({ email });
    console.log(isExistingUser);
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
    const user = await this.findOne({ id });
    if (!user) {
      throw new NotFoundException(`No user found with id ${id}`);
    }
    console.log("meapi",user)
    //@ts-ignore
    if (user.role === Role.ApiUser) {
      //@ts-ignore
      const api_user = await this.get_apiuser_permission_status(user.api_user_id);
      user['permission_status'] = api_user.permission_status;

    }
    console.log("meapi",user)
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


  public getatleastoneotheruserinOrg(organizationId: number, userId): Promise<User[]> {

    return this.repository.find({
      where: {
        id: Not(userId),
        organization: organizationId
      },
      order: {
        id: 'DESC',
      },
      take: 1
    });

  }

  async removeFromOrganization(userId: number): Promise<void> {
    await this.repository.update(userId, { organization: undefined });
  }

  async remove(userId: number): Promise<void> {

    await this.emailConfirmationService.remove(userId)
    await this.repository.delete(userId);
  }

  async updateProfile(
    id: number,
    { firstName, lastName, email }: UpdateUserProfileDTO,
  ): Promise<ExtendedBaseEntity & IUser> {
    const updateEntity = new User({

      firstName,
      lastName,
      email: email.toLowerCase(),

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
    const updateuser = await this.findById(id);
    //@ts-ignore
    if (!(updateuser.email === email.toLowerCase())) {
      //@ts-ignore
      await this.checkForExistingUser(email.toLowerCase());
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
    emailConfirmation: UserDTO,
    user: UserChangePasswordUpdate,
  ): Promise<UserDTO> {
    // const emailConfirmation = await this.emailConfirmationService.findOne({ token });
    console.log("emailConfirmation")

    //const _user = await this.findById(emailConfirmation.id);

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
    const getrole = await this.rolerepository.findOne({ name: role })
    console.log(getrole);
    // var roleId;
    // if (role === Role.DeviceOwner) {
    //   roleId = 3
    // }if else (role === Role.OrganizationAdmin) {
    //   roleId = 3
    // }
    //  else {
    //   roleId = 5
    // }
    await this.repository.update(userId, { role, roleId: getrole.id });
    return this.findOne({ id: userId });
  }


  async getPlatformAdmin(): Promise<IUser | undefined> {
    return this.findOne({ role: Role.Admin });
  }

  public async getUsersByFilter(filterDto: UserFilterDTO, pageNumber: number, limit: number): Promise<{ users: IUser[], currentPage: number, totalPages: number, totalCount: number }> {
    const query = await this.getFilteredQuery(filterDto);
    try {
      let [users, totalCount] = await query
      .andWhere(`role != :role`, { role: Role.ApiUser})
      .skip((pageNumber - 1) * limit).take(limit).getManyAndCount();
      const totalPages = Math.ceil(totalCount / limit);
      
      return {
        users: users,
        currentPage: pageNumber,
        totalPages,
        totalCount
      }
    } catch (error) {
      this.logger.error(`Failed to retrieve users`, error.stack);
      throw new InternalServerErrorException('Failed to retrieve users');
    }
  }

  private getFilteredQuery(filterDto: UserFilterDTO): SelectQueryBuilder<User> {
    const { organizationName, status } = filterDto;
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

    const validationErrors = await validate(data, {
      skipUndefinedProperties: true,
    });
    console.log(validationErrors);
    if (validationErrors.length > 0) {
      throw new UnprocessableEntityException({
        success: false,
        errors: validationErrors,
      });
    }

    const updateuser = await this.findById(id);
    //@ts-ignore
    if (!(updateuser.email === data.email)) {
      //@ts-ignore
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
    //@ts-ignore
    if (user.role === Role.ApiUser) {
      //@ts-ignore
      const api_user = await this.get_apiuser_permission_status(user.api_user_id);
      user['permission_status'] = api_user.permission_status;

    }
    return user;
  }
  public async geytokenforResetPassword(email): Promise<ISuccessResponse> {


    return await this.emailConfirmationService.ConfirmationEmailForResetPassword(email);


  }

  public async sentinvitiontoUser(inviteuser, email, invitationId) {
    const getcurrenttoken = await this.emailConfirmationService.getByEmail(email)
    console.log("hgtdfd", getcurrenttoken);
    if (!getcurrenttoken) {
      return {
        message: 'Token not found',
        success: false,
      };
    }
    const { id, confirmed } = getcurrenttoken;
    let { token, expiryTimestamp } = await this.emailConfirmationService.generatetoken(getcurrenttoken, id);
    await this.emailConfirmationService.sendInvitation(inviteuser, email, invitationId);
  }

  public async findUserByOrganization(organizationId: number, pageNumber: number, limit: number) {
    return await this.repository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.organization', 'organization')
      .where('organization.id = :organizationId', { organizationId })
      .orderBy('user.createdAt', 'DESC')
      .skip((pageNumber - 1) * limit)
      .take(limit)
      .getManyAndCount();
  }

  async apiuser_permission_request(api_id, permissionIds) {

    await this.apiUserEntityRepository.update(api_id, {
      permissionIds: permissionIds,
      permission_status: UserPermissionStatus.Request

    })
  }
  async apiuser_permission_accepted_byadmin(api_id: string, status: UserPermissionStatus) {

    // const approve_apiuser_permissiom = await this.apiUserEntityRepository.findOne(api_id )

    await this.apiUserEntityRepository.update(api_id, {

      permission_status: status

    })
    return await this.apiUserEntityRepository.findOne(api_id);
  }

  async get_apiuser_permission_status(api_id: string) {

    const status_apiuser_permissiom = await this.apiUserEntityRepository.findOne(api_id)

    return status_apiuser_permissiom;
  }


  public async getApiUsers(organizationName: string, pageNumber: number, limit: number): Promise<{ users: IUser[], currentPage: number, totalPages: number, totalCount: number }> {
    let filterDto = new UserFilterDTO;
    filterDto.organizationName = organizationName;
    console.log("filterDto:",filterDto);
    const query = await this.getFilteredQuery(filterDto);
      try {
        const [apiusers, totalCount] = await query
        .andWhere(`role = :role`, { role: Role.ApiUser})
        .skip((pageNumber - 1) * limit)
        .take(limit)
        .getManyAndCount();

        const totalPages = Math.ceil(totalCount / limit);
        return {
          users: apiusers,
          currentPage: pageNumber,
          totalPages,
          totalCount
        }
      } catch (error) {
        this.logger.error(`Failed to retrieve apiusers`, error.stack);
        throw new InternalServerErrorException('Failed to retrieve apiusers');
      }
    }
}

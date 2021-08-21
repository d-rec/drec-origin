import {
  ConflictException,
  Injectable,
  Logger,
  UnprocessableEntityException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
import { FindConditions, Repository, FindManyOptions } from 'typeorm';
import {
  ILoggedInUser,
  isRole,
  IUser,
  IUserFilter,
  UserPasswordUpdate,
} from '../../models';
import { Role, UserStatus } from '../../utils/enums';
import { CreateUserDTO } from './dto/create-user.dto';
import { ExtendedBaseEntity } from '@energyweb/origin-backend-utils';
import { validate } from 'class-validator';

import { UserDTO } from './dto/user.dto';
import { User } from './user.entity';
import { UpdateUserProfileDTO } from './dto/update-user-profile.dto';
import { EmailConfirmationService } from '../email-confirmation';
import { UpdateUserDTO } from '../admin/dto/update-user.dto';

export type TUserBaseEntity = ExtendedBaseEntity & IUser;

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User) private readonly repository: Repository<User>,
    private readonly emailConfirmationService: EmailConfirmationService,
  ) {}

  public async seed(
    data: CreateUserDTO,
    organizationId: number,
    role?: Role,
    status?: UserStatus,
  ): Promise<UserDTO> {
    await this.checkForExistingUser(data.email);

    return this.repository.save({
      title: data.title,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      telephone: data.telephone,
      password: this.hashPassword(data.password),
      role: role || Role.Admin,
      status: status || UserStatus.Active,
      organization: { id: organizationId },
    });
  }

  public async create(data: CreateUserDTO): Promise<UserDTO> {
    await this.checkForExistingUser(data.email);
    const user = await this.repository.save({
      title: data.title,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      telephone: data.telephone,
      password: this.hashPassword(data.password),
      notifications: true,
      status: UserStatus.Pending,
      role: Role.OrganizationAdmin,
    });

    await this.emailConfirmationService.create(user);

    return new User(user);
  }

  public async getAll(options?: FindManyOptions<UserDTO>): Promise<IUser[]> {
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

    return user;
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
    });
  }

  async removeFromOrganization(userId: number): Promise<void> {
    await this.repository.update(userId, { organization: undefined });
  }

  async updateProfile(
    id: number,
    { firstName, lastName, email, telephone }: UpdateUserProfileDTO,
  ): Promise<ExtendedBaseEntity & IUser> {
    const updateEntity = new User({
      firstName,
      lastName,
      email,
      telephone,
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

  public async changeRole(
    userId: number,
    role: Role,
  ): Promise<ExtendedBaseEntity & IUser> {
    this.logger.log(`Changing user role for userId=${userId} to ${role}`);
    await this.repository.update(userId, { role });
    return this.findOne({ id: userId });
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

  async getPlatformAdmin(): Promise<IUser | undefined> {
    return this.findOne({ role: Role.Admin });
  }

  public async getUsersBy(filter: IUserFilter): Promise<IUser[]> {
    const { orgName, status } = filter;

    const isNullOrUndefined = (variable: any) =>
      variable === null || variable === undefined;
    let result;
    if (orgName === undefined || '') {
      result = await this.repository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.organization', 'organization')
        .where(
          `${isNullOrUndefined(status) ? '' : 'user.status = :status'} 
            `,
        )
        .getMany();
    } else {
      const _orgName = `%${orgName}%`;
      result = await this.repository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.organization', 'organization')
        .where(
          `organization.name ilike :_orgName ${
            isNullOrUndefined(status) ? '' : 'and user.status = :status'
          } `,
          { _orgName, status },
        )
        .getMany();
    }
    return result;
  }

  async update(
    id: number,
    data: UpdateUserDTO,
  ): Promise<ExtendedBaseEntity & IUser> {
    const entity = await this.findOne({ id });

    if (!entity) {
      throw new Error(`Can't find entity.`);
    }

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
      title: data.title,
      firstName: data.firstName,
      lastName: data.lastName,
      telephone: data.telephone,
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
    const isAdmin = isRole(Role.Admin);

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

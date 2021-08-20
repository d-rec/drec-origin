import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
import { FindConditions, Repository, FindManyOptions } from 'typeorm';
import { IUser } from '../../models';
import { CreateUserDTO } from './dto/create-user.dto';

import { UserDTO } from './dto/user.dto';
import { User } from './user.entity';
import { UserStatus } from '../../utils/eums';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User) private readonly repository: Repository<User>,
  ) {}

  public async seed(data: CreateUserDTO): Promise<UserDTO> {
    await this.checkForExistingUser(data.email);

    return this.repository.save({
      title: data.title,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      telephone: data.telephone,
      password: this.hashPassword(data.password),
      role: data.role,
      // status: UserStatus.Active,
      organizationId: data.organizationId,
    });
  }

  public async create(data: CreateUserDTO): Promise<UserDTO> {
    await this.checkForExistingUser(data.email);
    return this.repository.save({
      title: data.title,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      telephone: data.telephone,
      password: this.hashPassword(data.password),
      role: data.role,
      // status: UserStatus.Pending,
      organizationId: data.organizationId,
    });
  }

  public async getAll(options?: FindManyOptions<UserDTO>): Promise<IUser[]> {
    return this.repository.find(options);
  }

  async findById(id: number): Promise<IUser | null> {
    return this.findOne({ id });
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

  async findOne(conditions: FindConditions<User>): Promise<User | null> {
    return (await this.repository.findOne(conditions)) ?? null;
  }

  private hashPassword(password: string) {
    return bcrypt.hashSync(password, 8);
  }

  private async hasUser(conditions: FindConditions<User>) {
    return Boolean(await this.findOne(conditions));
  }

  private async checkForExistingUser(email: string): Promise<void> {
    const isExistingUser = await this.hasUser({ email: email });
    if (isExistingUser) {
      const message = `User with email ${email} already exists`;

      this.logger.error(message);
      throw new ConflictException({
        success: false,
        message,
      });
    }
  }
}

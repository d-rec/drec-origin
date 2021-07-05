import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';

import { IOrganization, Organization } from './organization.entity';

@Injectable()
export class OrganizationService {
  private readonly logger = new Logger(OrganizationService.name);

  constructor(
    @InjectRepository(Organization)
    private readonly repository: Repository<Organization>,
    private userService: UserService,
  ) {}

  async create(organizationToRegister: IOrganization): Promise<Organization> {
    this.logger.debug(
      `Requested organization registration ${JSON.stringify(
        organizationToRegister,
      )}`,
    );

    const organizationToCreate = new Organization(organizationToRegister);

    const stored = await this.repository.save(organizationToCreate);

    this.logger.debug(
      `Successfully registered a new organization with id ${organizationToRegister.code}`,
    );

    return stored;
  }

  async findOne(
    id: string | number,
    options: FindOneOptions<Organization> = {},
  ): Promise<Organization | null> {
    return (
      (await this.repository.findOne(id, {
        ...options,
      })) ?? null
    );
  }

  public async findByBlockchainAddress(address: string): Promise<Organization> {
    return await this.repository.findOneOrFail({
      blockchainAccountAddress: address,
    });
  }

  public async findByIds(ids: string[]): Promise<IOrganization[]> {
    return this.repository.findByIds(ids);
  }

  async getAll(): Promise<Organization[]> {
    return this.repository.find();
  }

  async remove(organizationId: number): Promise<void> {
    await this.repository.delete(organizationId);
  }

  public async findOrganizationUsers(code: string): Promise<User[] | []> {
    return await this.userService.getAll({ where: { organizationId: code } });
  }
}

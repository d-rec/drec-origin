/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, Repository } from 'typeorm';
import { getProviderWithFallback } from '@energyweb/utils-general';
import { Wallet } from 'ethers';
import { Organization } from './organization.entity';
import { BlockchainPropertiesService } from '@energyweb/issuer-api';
import { NewOrganizationDTO, UpdateOrganizationDTO } from './dto';
import { defaults } from 'lodash';
import { Contracts } from '@energyweb/issuer';
import { IFullOrganization, isRole, IUser, LoggedInUser } from '../../models';
import { User } from '../user';
import { OrganizationNameAlreadyTakenError } from './error/organization-name-taken.error';
import { OrganizationStatus, Role } from '../../utils/enums';

@Injectable()
export class OrganizationService {
  private readonly logger = new Logger(OrganizationService.name);

  constructor(
    @InjectRepository(Organization)
    private readonly repository: Repository<Organization>,
    private readonly blockchainPropertiesService: BlockchainPropertiesService,
  ) {}

  async findOne(
    id: number,
    options: FindOneOptions<Organization> = {},
  ): Promise<Organization> {
    const organization = await this.repository.findOne(id, {
      ...options,
    });
    if (!organization) {
      throw new NotFoundException(`No organization found with id ${id}`);
    }
    return organization;
  }

  public async findByBlockchainAddress(address: string): Promise<Organization> {
    return await this.repository.findOneOrFail({
      blockchainAccountAddress: address,
    });
  }

  public async findByIds(ids: string[]): Promise<IFullOrganization[]> {
    return this.repository.findByIds(ids);
  }

  async getAll(): Promise<Organization[]> {
    return this.repository.find();
  }

  async remove(organizationId: number): Promise<void> {
    await this.repository.delete(organizationId);
  }

  async getDeviceManagers(id: number): Promise<IUser[]> {
    const members = await this.getMembers(id);

    return members.filter((u) => isRole(u.role, Role.DeviceOwner));
  }

  async getMembers(id: number): Promise<IUser[]> {
    const organization = await this.findOne(id);

    return organization.users;
  }

  public async findOrganizationUsers(id: number): Promise<IUser[]> {
    const organization = await this.findOne(id);
    return organization ? organization.users : [];
  }

  async seed(organizationToRegister: IFullOrganization): Promise<Organization> {
    this.logger.debug(
      `Requested organization registration ${JSON.stringify(
        organizationToRegister,
      )}`,
    );

    const organizationToCreate = new Organization(organizationToRegister);

    const stored = await this.repository.save(organizationToCreate);

    this.logger.debug(
      `Successfully registered a new organization with id ${organizationToCreate.id}`,
    );

    return stored;
  }

  public async create(
    organizationToRegister: NewOrganizationDTO,
    user: LoggedInUser,
  ): Promise<Organization> {
    this.logger.debug(
      `User ${JSON.stringify(
        user,
      )} requested organization registration ${JSON.stringify(
        organizationToRegister,
      )}`,
    );

    const allOrganizationsCount = await this.repository.count();
    const blockchainAccountAddress = await this.generateBlockchainAddress(
      allOrganizationsCount,
    );

    if (await this.isNameAlreadyTaken(organizationToRegister.name)) {
      throw new OrganizationNameAlreadyTakenError(organizationToRegister.name);
    }

    const organizationToCreate = new Organization({
      ...organizationToRegister,
      blockchainAccountAddress,

      status: OrganizationStatus.Submitted,
      users: [{ id: user.id } as User],
    });

    const stored = await this.repository.save(organizationToCreate);

    this.logger.debug(
      `Successfully registered a new organization with id ${organizationToRegister.name}`,
    );

    this.logger.debug(
      `User ${JSON.stringify(
        user,
      )} successfully registered new organization with id ${stored.id}`,
    );

    return stored;
  }

  private async generateBlockchainAddress(index: number): Promise<string> {
    const issuerAccount = Wallet.fromMnemonic(
      process.env.MNEMONIC!,
      `m/44'/60'/0'/0/${0}`,
    ); // Index 0 account

    const [primaryRpc, fallbackRpc] = process.env.WEB3!.split(';');
    const provider = getProviderWithFallback(primaryRpc, fallbackRpc);
    const blockchainAccount = Wallet.fromMnemonic(
      process.env.MNEMONIC!,
      `m/44'/60'/0'/0/${index + 1}`,
    );

    const blockchainProperties = await this.blockchainPropertiesService.get();

    const registryWithSigner = Contracts.factories.RegistryFactory.connect(
      blockchainProperties!.registry,
      new Wallet(blockchainAccount.privateKey, provider),
    );

    await registryWithSigner.setApprovalForAll(issuerAccount.address, true);

    return blockchainAccount.address;
  }

  async update(
    organizationId: number,
    updateOrganizationDTO: UpdateOrganizationDTO,
  ): Promise<Organization> {
    let currentOrg = await this.findOne(organizationId);
    currentOrg = defaults(updateOrganizationDTO, currentOrg);
    return await this.repository.save(currentOrg);
  }

  private async isNameAlreadyTaken(name: string): Promise<boolean> {
    const existingOrganizations = await this.repository
      .createQueryBuilder()
      .where('LOWER(name) = LOWER(:name)', { name })
      .getCount();

    return existingOrganizations > 0;
  }
}

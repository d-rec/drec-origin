import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { getProviderWithFallback } from '@energyweb/utils-general';
import { Wallet } from 'ethers';
import { Contracts } from '@energyweb/issuer';
import { IOrganization, Organization } from './organization.entity';
import { BlockchainPropertiesService } from '@energyweb/issuer-api';
import { NewOrganizationDTO, UpdateOrganizationDTO } from './dto';
import { defaults } from 'lodash';

@Injectable()
export class OrganizationService {
  private readonly logger = new Logger(OrganizationService.name);

  constructor(
    @InjectRepository(Organization)
    private readonly repository: Repository<Organization>,
    private userService: UserService,
    private blockchainPropertiesService: BlockchainPropertiesService,
  ) {}

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

  async seed(organizationToRegister: IOrganization): Promise<Organization> {
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

  public async create(
    organizationToRegister: NewOrganizationDTO,
  ): Promise<Organization> {
    this.logger.debug(
      `Requested organization registration ${JSON.stringify(
        organizationToRegister,
      )}`,
    );

    const allOrganizationsCount = await this.repository.count();
    const blockchainAccountAddress = await this.generateBlockchainAddress(
      allOrganizationsCount,
    );
    const organizationToCreate = new Organization({
      ...organizationToRegister,
      blockchainAccountAddress,
    });

    const stored = await this.repository.save(organizationToCreate);

    this.logger.debug(
      `Successfully registered a new organization with id ${organizationToRegister.code}`,
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
    organizationCode: string,
    updateOrganizationDTO: UpdateOrganizationDTO,
  ): Promise<Organization> {
    let currentOrg = await this.findOne(organizationCode);
    if (!currentOrg) {
      throw new NotFoundException(
        `No organization found with code ${organizationCode}`,
      );
    }
    currentOrg = defaults(updateOrganizationDTO, currentOrg);
    return await this.repository.save(currentOrg);
  }
}

/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, Repository } from 'typeorm';
import {
  getProviderWithFallback,
  recoverTypedSignatureAddress,
} from '@energyweb/utils-general';
import { utils, Wallet } from 'ethers';
import { ConfigService } from '@nestjs/config';
import { Organization } from './organization.entity';
import { BlockchainPropertiesService } from '@energyweb/issuer-api';
import {
  BindBlockchainAccountDTO,
  NewOrganizationDTO,
  UpdateOrganizationDTO,
} from './dto';
import { defaults } from 'lodash';
import { Contracts } from '@energyweb/issuer';
import {
  IFullOrganization,
  isRole,
  ISuccessResponse,
  IUser,
  LoggedInUser,
  ResponseSuccess,
} from '../../models';
import { OrganizationNameAlreadyTakenError } from './error/organization-name-taken.error';
import { OrganizationDocumentOwnershipMismatchError } from './error/organization-document-ownership-mismatch.error';
import { OrganizationStatus, Role } from '../../utils/enums';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { MailService } from '../../mail';
import { FileService } from '../file';

@Injectable()
export class OrganizationService {
  private readonly logger = new Logger(OrganizationService.name);

  constructor(
    @InjectRepository(Organization)
    private readonly repository: Repository<Organization>,
    private readonly configService: ConfigService,
    private readonly blockchainPropertiesService: BlockchainPropertiesService,
    private readonly userService: UserService,
    private readonly mailService: MailService,
    private readonly fileService: FileService,
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

    if (await this.isNameAlreadyTaken(organizationToRegister.name)) {
      throw new OrganizationNameAlreadyTakenError(organizationToRegister.name);
    }
    const documents = [
      ...(organizationToRegister.documentIds ?? []),
      ...(organizationToRegister.signatoryDocumentIds ?? []),
    ];

    if (!(await this.isDocumentOwner(user, documents))) {
      throw new OrganizationDocumentOwnershipMismatchError();
    }

    const organizationToCreate = new Organization({
      ...organizationToRegister,

      status: OrganizationStatus.Submitted,
      users: [{ id: user.id } as User],
    });

    const stored = await this.repository.save(organizationToCreate);
    await this.fileService.updateOrganization(user, documents);

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

    const registryWithSigner =
      Contracts.factories.RegistryExtendedFactory.connect(
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

  async changeMemberRole(
    organizationId: number,
    memberId: number,
    newRole: Role,
  ): Promise<void> {
    const organization = await this.findOne(organizationId);

    if (!organization.users.find((u) => u.id === memberId)) {
      throw new BadRequestException({
        success: false,
        message: `User to be removed is not part of the organization.`,
      });
    }

    const userToBeChanged = await this.userService.findById(memberId);
    const admins = organization.users.filter((u) =>
      isRole(u.role, Role.OrganizationAdmin),
    );

    if (
      newRole !== Role.OrganizationAdmin &&
      isRole(userToBeChanged.role, Role.OrganizationAdmin) &&
      admins.length < 2
    ) {
      throw new BadRequestException({
        success: false,
        message: `Can't change role of admin user from organization. There always has to be at least one admin in the organization.`,
      });
    }

    await this.userService.changeRole(memberId, newRole);
    await this.sendRoleChangeEmail(organization, userToBeChanged, newRole);
  }

  async setBlockchainAddress(
    id: number,
    signedMessage: BindBlockchainAccountDTO['signedMessage'],
  ): Promise<ISuccessResponse> {
    if (!signedMessage) {
      throw new BadRequestException('Signed message is empty.');
    }

    const organization = await this.findOne(id);

    if (organization.blockchainAccountAddress) {
      throw new ConflictException(
        'Organization already has a blockchain address',
      );
    }

    const address = await recoverTypedSignatureAddress(
      this.configService.get<string>('REGISTRATION_MESSAGE_TO_SIGN') ||
        'I register as D-REC user',
      signedMessage,
    );

    return this.updateBlockchainAddress(
      id,
      utils.getAddress(address),
      signedMessage,
    );
  }

  async updateBlockchainAddress(
    orgId: number,
    address: string,
    signedMessage?: string,
  ): Promise<ISuccessResponse> {
    const organization = await this.findOne(orgId);

    const alreadyExistingOrganizationWithAddress = await this.repository.count({
      blockchainAccountAddress: address,
    });

    if (alreadyExistingOrganizationWithAddress > 0) {
      throw new ConflictException(
        `This blockchain address has already been linked to a different organization.`,
      );
    }

    organization.blockchainAccountSignedMessage = signedMessage || '';
    organization.blockchainAccountAddress = address;

    await this.repository.save(organization);

    return ResponseSuccess();
  }

  private async isNameAlreadyTaken(name: string): Promise<boolean> {
    const existingOrganizations = await this.repository
      .createQueryBuilder()
      .where('LOWER(name) = LOWER(:name)', { name })
      .getCount();

    return existingOrganizations > 0;
  }

  private async sendRoleChangeEmail(
    organization: IFullOrganization,
    member: IUser,
    role: Role,
  ): Promise<void> {
    const url = `${process.env.UI_BASE_URL}/account/user-profile`;

    const result = await this.mailService.send({
      to: member.email,
      subject: `[Origin] Organization role update`,
      html: `The administrator of ${organization.name} changed your role to ${Role[role]}. Visit <a href="${url}">${url}</a> to see the details.`,
    });

    if (result) {
      this.logger.log(`Notification email sent to ${member.email}.`);
    }
  }

  private async isDocumentOwner(user: LoggedInUser, documentIds: string[]) {
    if (!documentIds?.length) {
      return true;
    }
    return this.fileService.isOwner(user, documentIds);
  }
}

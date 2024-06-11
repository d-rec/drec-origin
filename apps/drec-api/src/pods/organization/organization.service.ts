/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, Repository, SelectQueryBuilder } from 'typeorm';
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
  NewAddOrganizationDTO,
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
import { OrganizationFilterDTO } from '../admin/dto/organization-filter.dto';

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
  ) { }

  async findOne(
    id: number,
    options: FindOneOptions<Organization> = {},
  ): Promise<Organization> {
    this.logger.verbose(`With in findOne`);
    const organization = await this.repository.findOne({
      where: {
        id: id,
        ...options,
      },
    });
    if (!organization) {
      this.logger.error(`No organization found with id ${id}`);
      throw new NotFoundException(`No organization found with id ${id}`);
    }
    return organization;
  }

  public async findByBlockchainAddress(address: string): Promise<Organization> {
    this.logger.verbose(`With in findByBlockchainAddress`);
    return await this.repository.findOneOrFail({
      where: {
        blockchainAccountAddress: address,
      },
    });
  }

  public async findByIds(ids: string[]): Promise<IFullOrganization[]> {
    this.logger.verbose(`With in findByIds`);
    return this.repository.findByIds(ids);
  }

  async getAll(
    filterDto: OrganizationFilterDTO,
    pageNumber: number,
    limit: number,
    user?: LoggedInUser,
  ): Promise<{
    organizations: Organization[];
    currentPage: number;
    totalPages: number;
    totalCount: number;
  }> {
    this.logger.verbose(`With in getAll`);
    let query = await this.getFilteredQuery(filterDto);
    try {
      if (user != undefined && user?.role === 'ApiUser') {
        query.andWhere('organization.api_user_id = :apiuserid', {
          apiuserid: user.api_user_id,
        }).andWhere(
          'organization.organizationType NOT IN (:...excludedRoles)',
          {
            excludedRoles: ['ApiUser', 'Admin'],
          }
        );
      }
      const [organizations, count] = await query
        .skip((pageNumber - 1) * limit)
        .take(limit)
        .getManyAndCount();
      const totalPages = Math.ceil(count / limit);
      return {
        organizations,
        currentPage: pageNumber,
        totalPages,
        totalCount: count,
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve organizations`, error.stack);
      throw new InternalServerErrorException(
        'Failed to retrieve organizations',
      );
    }
  }

  async remove(organizationId: number): Promise<void> {
    this.logger.verbose(`With in delete`);
    await this.repository.delete(organizationId);
  }

  async getDeviceManagers(id: number): Promise<IUser[]> {
    this.logger.verbose(`With in getDeviceManagers`);
    const members = await this.getMembers(id);

    return members.filter((u) => isRole(u.role, Role.DeviceOwner));
  }

  async getMembers(id: number): Promise<IUser[]> {
    this.logger.verbose(`With in getMembers`);
    const organization = await this.findOne(id);

    return organization.users;
  }

  public async findOrganizationUsers(
    id: number,
    pageNumber: number,
    limit: number,
    role?: string,
  ): Promise<{
    users: IUser[];
    currentPage: number;
    totalPages: number;
    totalCount: number;
  }> {
    this.logger.verbose(`With in findOrganizationUsers`);
    /* const organization = await this.findOne(id);
     return organization ? organization.users : []; */
    const [users, totalCount] = await this.userService.findUserByOrganization(
      id,
      pageNumber,
      limit,
    );
    const totalPages = Math.ceil(totalCount / limit);
    let newuser = users;
    if (role != undefined && role != Role.OrganizationAdmin) {
      newuser = users.filter((user) => user.role != 'OrganizationAdmin');
    }

    return {
      users: newuser,
      currentPage: pageNumber,
      totalPages,
      totalCount,
    };
  }
  public async findApiuserOrganizationUsers(
    apiuser_id: string,
    pageNumber: number,
    limit: number,
  ): Promise<{
    users: IUser[];
    currentPage: number;
    totalPages: number;
    totalCount: number;
  }> {
    this.logger.verbose(`With in findApiuserOrganizationUsers`);
    /* const organization = await this.findOne(id);
     return organization ? organization.users : []; */
    const [users, totalCount] = await this.userService.findUserByApiUserId(
      apiuser_id,
      pageNumber,
      limit,
    );
    const totalPages = Math.ceil(totalCount / limit);
    return {
      users: users,
      currentPage: pageNumber,
      totalPages,
      totalCount,
    };
  }
  async seed(organizationToRegister: IFullOrganization): Promise<Organization> {
    this.logger.debug(
      `Requested organization registration ${JSON.stringify(
        organizationToRegister.name,
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
    this.logger.verbose(`With in create`);
    this.logger.debug(
      `User ${JSON.stringify(
        user.id,
      )} requested organization registration ${JSON.stringify(
        organizationToRegister.name,
      )}`,
    );

    if (await this.isNameAlreadyTaken(organizationToRegister.name)) {
      this.logger.error(
        new OrganizationNameAlreadyTakenError(organizationToRegister.name),
      );
      throw new OrganizationNameAlreadyTakenError(organizationToRegister.name);
    }
    const documents = [
      ...(organizationToRegister.documentIds ?? []),
      ...(organizationToRegister.signatoryDocumentIds ?? []),
    ];

    if (!(await this.isDocumentOwner(user, documents))) {
      this.logger.error(new OrganizationDocumentOwnershipMismatchError());
      throw new OrganizationDocumentOwnershipMismatchError();
    }

    const organizationToCreate = new Organization({
      ...organizationToRegister,

      status: OrganizationStatus.Submitted,
      users: [{ id: user.id } as User],
    });

    const stored = await this.repository.save(organizationToCreate);

    const updatedUser = await this.userService.findById(user.id);

    if (documents.length) {
      await this.fileService.assignFilesToUser(
        new LoggedInUser(updatedUser),
        documents,
      );
    }

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

  public async newcreate(
    organizationToRegister: NewAddOrganizationDTO,
  ): Promise<Organization> {
    this.logger.verbose('With in newcreate');
    this.logger.debug(
      ` requested organization registration ${JSON.stringify(
        organizationToRegister.name,
      )}`,
    );
    //  const organization = await this.repository.findOne({secretKey:organizationToRegister.secretKey});
    // if (!organization) {
    const organizationToCreate = new Organization({
      ...organizationToRegister,

      status: OrganizationStatus.Active,
    });

    try {
      const stored = await this.repository.save(organizationToCreate);

      this.logger.debug(
        `Successfully registered a new organization with id ${organizationToRegister.name}`,
      );

      return stored;
    } catch (error) {
      this.logger.error(`Failed to retrieve device`, error);
    }

    //  }
    // else{
    // return organization;
    // }
  }

  private async generateBlockchainAddress(index: number): Promise<string> {
    this.logger.verbose(`With in generateBlockchainAddress`);
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
    this.logger.verbose(`With in update`);
    let currentOrg = await this.findOne(organizationId);
    currentOrg = defaults(updateOrganizationDTO, currentOrg);
    return await this.repository.save(currentOrg);
  }

  async changeMemberRole(
    organizationId: number,
    memberId: number,
    newRole: Role,
  ): Promise<void> {
    this.logger.verbose(`With in changeMemberRole`);
    const organization = await this.findOne(organizationId);

    if (!organization.users.find((u) => u.id === memberId)) {
      this.logger.error(`User to be removed is not part of the organization.`);
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
      this.logger.error(
        `Can't change role of admin user from organization. There always has to be at least one admin in the organization.`,
      );
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
    this.logger.verbose(`With in setBlockchainAddress`);
    if (!signedMessage) {
      this.logger.error(`Signed message is empty.`);
      throw new BadRequestException('Signed message is empty.');
    }

    const organization = await this.findOne(id);

    if (organization.blockchainAccountAddress) {
      this.logger.error(`Organization already has a blockchain address`);
      throw new ConflictException(
        'Organization already has a blockchain address',
      );
    }

    const registrationMessageToSign = this.configService.get<string>(
      'REGISTRATION_MESSAGE_TO_SIGN',
    );

    if (!registrationMessageToSign) {
      this.logger.error(`Registration message to sign missing!`);
      throw new BadRequestException('Registration message to sign missing!');
    }

    const address = await recoverTypedSignatureAddress(
      registrationMessageToSign,
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
    this.logger.verbose(`With in updateBlockchainAddress`);
    const organization = await this.findOne(orgId);

    const alreadyExistingOrganizationWithAddress = await this.repository.count({
      where: {
        blockchainAccountAddress: address,
      },
    });

    if (alreadyExistingOrganizationWithAddress > 0) {
      this.logger.error(
        `This blockchain address has already been linked to a different organization.`,
      );
      throw new ConflictException(
        `This blockchain address has already been linked to a different organization.`,
      );
    }

    organization.blockchainAccountSignedMessage = signedMessage || '';
    organization.blockchainAccountAddress = address;

    await this.repository.save(organization);

    return ResponseSuccess();
  }

  async isNameAlreadyTaken(name: string): Promise<boolean> {
    this.logger.verbose(`With in isNameAlreadyTaken`);
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
    this.logger.verbose(`With in sendRoleChangeEmail`);
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
    this.logger.verbose(`With in isDocumentOwner`);
    if (!documentIds?.length) {
      return true;
    }
    return this.fileService.isOwner(user, documentIds);
  }

  // private async checkForExistingorg(email: string): Promise<void> {
  //   const isExistingUser = await this.hasorg({ email });
  //   if (isExistingUser) {
  //     const message = `User with email ${email} already exists`;

  //     this.logger.error(message);
  //     throw new ConflictException({
  //       success: false,
  //       message,
  //     });
  //   }
  // }
  // private async hasorg(conditions: FindConditions<Organization>) {
  //   return Boolean(await this.findOne(conditions));
  // }

  public async getFilteredQuery(
    filterDto: OrganizationFilterDTO,
  ): Promise<SelectQueryBuilder<Organization>> {
    this.logger.verbose(`With in getFilteredQuery`, filterDto);
    const { organizationName, organizationType } = filterDto;
    console.log(organizationName)
    const query = this.repository
      .createQueryBuilder('organization')
      .leftJoinAndSelect('organization.users', 'users')
      .orderBy('organization.name', 'ASC');
    if (organizationName) {
      const baseQuery = 'organization.name ILIKE :organizationName';
      query.andWhere(baseQuery, { organizationName: `%${organizationName}%` });
    }
    if (organizationType) {
      query.andWhere(`organization.organizationType != :organizationType`, {
        organizationType: `%${organizationType}%`,
      });
    }
    return query;
  }
}

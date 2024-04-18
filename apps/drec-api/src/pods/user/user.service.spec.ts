import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { Repository, DeepPartial, FindManyOptions, FindOptionsWhere } from 'typeorm';
import { User } from './user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserRole } from './user_role.entity';
import { EmailConfirmationService } from '../email-confirmation/email-confirmation.service';
import { OauthClientCredentialsService } from './oauth_client.service';
import { OrganizationService } from '../organization/organization.service';
import { ApiUserEntity } from './api-user.entity';
import { UserLoginSessionEntity } from './user_login_session.entity';
import { CreateUserORGDTO } from './dto/create-user.dto';
import { Organization } from '../organization/organization.entity';
import {
  OrganizationStatus,
  Role,
  UserPermissionStatus,
  UserStatus,
} from '../../utils/enums';
import { v4 as uuid } from 'uuid';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { EmailConfirmation } from '../email-confirmation/email-confirmation.entity';
import { IUser } from '../../models';

describe('UserService', () => {
  let service: UserService;
  let repository: Repository<User>;
  let rolerepository: Repository<UserRole>;
  let emailConfirmationService: EmailConfirmationService;
  let oauthClientCredentialsService: OauthClientCredentialsService;
  let organizationService: OrganizationService;
  let apiUserEntityRepository: Repository<ApiUserEntity>;
  let userloginSessionRepository: Repository<UserLoginSessionEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(UserRole),
          useClass: Repository,
        },
        {
          provide: EmailConfirmationService,
          useValue: {
            create: jest.fn(),
            get: jest.fn(),
            admincreate: jest.fn(),
          } as any,
        },
        {
          provide: OauthClientCredentialsService,
          useValue: {
            findOneByApiUserId: jest.fn(),
          } as any,
        },
        {
          provide: OrganizationService,
          useValue: {
            isNameAlreadyTaken: jest.fn(),
            newcreate: jest.fn(),
          } as any,
        },
        {
          provide: getRepositoryToken(ApiUserEntity),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(UserLoginSessionEntity),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
    rolerepository = module.get<Repository<UserRole>>(
      getRepositoryToken(UserRole),
    );
    oauthClientCredentialsService = module.get<OauthClientCredentialsService>(
      OauthClientCredentialsService,
    );
    organizationService = module.get<OrganizationService>(OrganizationService);
    emailConfirmationService = module.get<EmailConfirmationService>(
      EmailConfirmationService,
    );
    apiUserEntityRepository = module.get<Repository<ApiUserEntity>>(
      getRepositoryToken(ApiUserEntity),
    );
    userloginSessionRepository = module.get<Repository<UserLoginSessionEntity>>(
      getRepositoryToken(UserLoginSessionEntity),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('newcreate', () => {
    it('should create a new user with valid input data when it is not invite', async () => {
      const userData: CreateUserORGDTO = {
        firstName: 'test',
        lastName: 'ApiUser',
        email: 'testsweya3@gmail.com',
        organizationType: 'ApiUser',
        password: 'Drec@1234',
        confirmPassword: 'Drec@1234',
        orgName: 'DIRECT_ORG_DEVELOPER1',
        orgAddress: 'Chennai',
        api_user_id: uuid(),
      } as CreateUserORGDTO;

      const orgData: Organization = {
        id: 1,
        name: userData.orgName,
        // @ts-ignore
        organizationType: userData.organizationType,
        // @ts-ignore
        orgEmail: userData.email,
        address: userData.orgAddress,
        zipCode: null,
        city: null,
        country: null,
        blockchainAccountAddress: null,
        blockchainAccountSignedMessage: null,
        status: OrganizationStatus.Active,
        users: [],
        invitations: [],
        documentIds: [],
        api_user_id: userData.api_user_id,
      } as Organization;

      const mockApiUserEntity: ApiUserEntity = {
        api_user_id: userData.api_user_id,
        permission_status: UserPermissionStatus.Request,
        permissionIds: [],
      };
      jest.spyOn(service, 'checkForExistingUser').mockResolvedValue(undefined);
      jest
        .spyOn(oauthClientCredentialsService, 'findOneByApiUserId')
        .mockResolvedValue({
          api_user_id: userData.api_user_id,
          permission_status: UserPermissionStatus.Request,
          permissionIds: [],
        });
      jest
        .spyOn(organizationService, 'isNameAlreadyTaken')
        .mockResolvedValue(false);
      jest.spyOn(organizationService, 'newcreate').mockResolvedValue(orgData);
      jest
        .spyOn(repository, 'save')
        .mockImplementation((user) =>
          Promise.resolve(user as DeepPartial<User> & User),
        );

      const result = await service.newcreate(userData);

      expect(result).toBeDefined();
      // @ts-ignore
      expect(service.checkForExistingUser).toHaveBeenCalledWith(
        userData.email.toLowerCase(),
      );
      expect(
        oauthClientCredentialsService.findOneByApiUserId,
      ).toHaveBeenCalledWith(userData.api_user_id);
      expect(organizationService.isNameAlreadyTaken).toHaveBeenCalledWith(
        userData.orgName,
      );
      expect(organizationService.newcreate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: userData.orgName,
          // @ts-ignore
          organizationType: userData.organizationType,
          // @ts-ignore
          orgEmail: userData.email,
          address: userData.orgAddress,
          api_user_id: userData.api_user_id,
        }),
      );

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          // @ts-ignore
          firstName: userData.firstName,
          // @ts-ignore
          lastName: userData.lastName,
          // @ts-ignore
          email: userData.email.toLowerCase(),
          password: expect.any(String),
          notifications: true,
          status: UserStatus.Active,
          role: Role.ApiUser,
          roleId: 6,
          organization: { id: 1 },
          api_user_id: userData.api_user_id,
        }),
      );
    });

    it('should throw a ConflictException if organization name already exists', async () => {
      const isNameAlreadyTakenSpy = jest
        .spyOn(organizationService, 'isNameAlreadyTaken')
        .mockResolvedValue(true);

      const userData: CreateUserORGDTO = {
        firstName: 'test',
        lastName: 'ApiUser',
        email: 'testsweya5@gmail.com',
        organizationType: 'ApiUser',
        password: 'Drec@1234',
        confirmPassword: 'Drec@1234',
        orgName: 'DIRECT_ORG_DEVELOPER1',
        orgAddress: 'Chennai',
        api_user_id: uuid(),
      } as CreateUserORGDTO;

      const mockOrganizationEntity = {
        id: 1,
        name: 'DIRECT_ORG_DEVELOPER1',
        address: 'Bangalore',
        zipCode: null,
        city: null,
        country: null,
        blockchainAccountAddress: null,
        blockchainAccountSignedMessage: null,
        orgEmail: 'testsweya@gmail.com',
        organizationType: Role.OrganizationAdmin,
        status: OrganizationStatus.Active,
        users: [],
        invitations: [],
        documentIds: [],
        api_user_id: 'apiuserId',
      } as Organization;

      const mockuserEntity = {
        id: 1,
        firstName: 'Dev',
        lastName: 'lastName',
        email: 'testsweya5@gmail.com',
        password: 'Drec@1234',
        notifications: null,
        status: UserStatus.Active,
        role: Role.OrganizationAdmin,
        roleId: 2,
        api_user_id: 'apiuserId',
        organization: mockOrganizationEntity,
        moduleName: null,
        updatedAt: new Date(),
      } as User;

      const mockemailConfirmationEntity = {
        id: 1,
        confirmed: true,
        token:
          'ab3bb2e439028fa3387c8959a7199f1d5646ee9805f44c5b24b0a4ae4ade3c9e4903ef646d15db71f9bac2d5fbbd38fa2d265fabfee32fddc8b8c02dc38ec63a',
        expiryTimestamp: 1708269930,
        user: mockuserEntity,
      } as EmailConfirmation;

      jest.spyOn(repository, 'findOne').mockResolvedValue(mockuserEntity);
      jest
        .spyOn(emailConfirmationService, 'get')
        .mockResolvedValue(mockemailConfirmationEntity);
      jest
        .spyOn(organizationService, 'isNameAlreadyTaken')
        .mockResolvedValue(true);

      await expect(service.newcreate(userData)).rejects.toThrowError(
        ConflictException,
      );
    });
  });

  describe('adminnewcreate', () => {
    it('should create a new user with valid input data', async () => {
      const userData: CreateUserORGDTO = {
        firstName: 'test',
        lastName: 'ApiUser',
        email: 'testsweya2@gmail.com',
        organizationType: 'Developer',
        password: 'Drec@1234',
        confirmPassword: 'Drec@1234',
        orgName: 'DIRECT_DEVELOPER1',
        orgAddress: 'Chennai',
        api_user_id: 'b44f8e86-3a9b-427b-8376-fdda83a1a8f4',
      } as CreateUserORGDTO;

      const orgData: Organization = {
        id: 1,
        api_user_id: userData.api_user_id,
        name: userData.orgName,
        // @ts-ignore
        organizationType: userData.organizationType,
        // @ts-ignore
        orgEmail: userData.email,
        address: userData.orgAddress,
        zipCode: null,
        city: null,
        country: null,
        blockchainAccountAddress: null,
        blockchainAccountSignedMessage: null,
        status: OrganizationStatus.Active,
        users: [],
        invitations: [],
        documentIds: [],
      } as Organization;

      const mockApiUserEntity: ApiUserEntity = {
        api_user_id: userData.api_user_id,
        permission_status: UserPermissionStatus.Request,
        permissionIds: [],
      };

      jest.spyOn(service, 'checkForExistingUser').mockResolvedValue(undefined);
      jest
        .spyOn(organizationService, 'isNameAlreadyTaken')
        .mockResolvedValue(false);
      jest.spyOn(organizationService, 'newcreate').mockResolvedValue(orgData);
      jest
        .spyOn(repository, 'save')
        .mockImplementation((user) =>
          Promise.resolve(user as DeepPartial<User> & User),
        );

      const resultPromise = service.adminnewcreate(userData);

      await expect(resultPromise).resolves.toBeDefined();
      // @ts-ignore
      await expect(service.checkForExistingUser).toHaveBeenCalledWith(
        userData.email.toLowerCase(),
      );
      await expect(organizationService.isNameAlreadyTaken).toHaveBeenCalledWith(
        userData.orgName,
      );
      await expect(organizationService.newcreate).toHaveBeenCalledWith({
        name: userData.orgName,
        //@ts-ignore
        organizationType: userData.organizationType,
        // @ts-ignore
        orgEmail: userData.email,
        address: userData.orgAddress,
      });
      await expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          // @ts-ignore
          firstName: userData.firstName,
          // @ts-ignore
          lastName: userData.lastName,
          // @ts-ignore
          email: userData.email.toLowerCase(),
          password: expect.any(String),
          notifications: true,
          status: UserStatus.Active,
          role: Role.OrganizationAdmin,
          roleId: 2,
          organization: { id: 1 },
        }),
      );
    });

    it('should throw a ConflictException if organization name already exists', async () => {
      const isNameAlreadyTakenSpy = jest
        .spyOn(organizationService, 'isNameAlreadyTaken')
        .mockResolvedValue(true);

      // Test data
      const userData: CreateUserORGDTO = {
        firstName: 'test',
        lastName: 'ApiUser',
        email: 'testsweya5@gmail.com',
        organizationType: 'ApiUser',
        password: 'Drec@1234',
        confirmPassword: 'Drec@1234',
        orgName: 'DIRECT_ORG_DEVELOPER1',
        orgAddress: 'Chennai',
        api_user_id: uuid(),
      } as CreateUserORGDTO;

      const mockOrganizationEntity = {
        id: 1,
        name: 'DIRECT_ORG_DEVELOPER1',
        address: 'Bangalore',
        zipCode: null,
        city: null,
        country: null,
        blockchainAccountAddress: null,
        blockchainAccountSignedMessage: null,
        orgEmail: 'testsweya@gmail.com',
        organizationType: Role.OrganizationAdmin,
        status: OrganizationStatus.Active,
        users: [],
        invitations: [],
        documentIds: [],
        api_user_id: 'apiuserId',
      } as Organization;

      const mockuserEntity = {
        id: 1,
        firstName: 'Dev',
        lastName: 'lastName',
        email: 'testsweya5@gmail.com',
        password: 'Drec@1234',
        notifications: null,
        status: UserStatus.Active,
        role: Role.OrganizationAdmin,
        roleId: 2,
        api_user_id: 'apiuserId',
        organization: mockOrganizationEntity,
        moduleName: null,
        updatedAt: new Date(),
      } as User;

      const mockemailConfirmationEntity = {
        id: 1,
        confirmed: true,
        token:
          'ab3bb2e439028fa3387c8959a7199f1d5646ee9805f44c5b24b0a4ae4ade3c9e4903ef646d15db71f9bac2d5fbbd38fa2d265fabfee32fddc8b8c02dc38ec63a',
        expiryTimestamp: 1708269930,
        user: mockuserEntity,
      } as EmailConfirmation;

      jest.spyOn(repository, 'findOne').mockResolvedValue(mockuserEntity);
      jest
        .spyOn(emailConfirmationService, 'get')
        .mockResolvedValue(mockemailConfirmationEntity);

      jest
        .spyOn(organizationService, 'isNameAlreadyTaken')
        .mockResolvedValue(true);

      await expect(service.adminnewcreate(userData)).rejects.toThrowError(
        ConflictException,
      );
    });
  });

  describe('getAll', () => {
    const mockOrganizationEntity1 = {
      id: 1,
      name: 'DIRECT_ORG_DEVELOPER1',
      address: 'Bangalore',
      zipCode: null,
      city: null,
      country: null,
      blockchainAccountAddress: null,
      blockchainAccountSignedMessage: null,
      orgEmail: 'testsweya@gmail.com',
      organizationType: Role.OrganizationAdmin,
      status: OrganizationStatus.Active,
      users: [],
      invitations: [],
      documentIds: [],
      api_user_id: 'apiuserId',
    } as Organization;

    const mockOrganizationEntity2 = {
      id: 2,
      name: 'DIRECT_ORG_DEVELOPER1',
      address: 'Bangalore',
      zipCode: null,
      city: null,
      country: null,
      blockchainAccountAddress: null,
      blockchainAccountSignedMessage: null,
      orgEmail: 'testsweya6@gmail.com',
      organizationType: Role.OrganizationAdmin,
      status: OrganizationStatus.Active,
      users: [],
      invitations: [],
      documentIds: [],
      api_user_id: 'apiuserId',
    } as Organization;

    const userss: IUser[] = [
      {
        id: 1,
        firstName: 'Dev',
        lastName: 'lastName',
        email: 'testsweya@gmail.com',
        notifications: null,
        status: UserStatus.Active,
        role: Role.OrganizationAdmin,
        roleId: 2,
        organization: mockOrganizationEntity1,
        moduleName: null,
      },
      {
        id: 2,
        firstName: 'Dev',
        lastName: 'lastName',
        email: 'testsweya5@gmail.com',
        notifications: null,
        status: UserStatus.Active,
        role: Role.User,
        roleId: 4,
        organization: mockOrganizationEntity1,
        moduleName: null,
      },
      {
        id: 3,
        firstName: 'Dev',
        lastName: 'lastName',
        email: 'testsweya2@gmail.com',
        notifications: null,
        status: UserStatus.Active,
        role: Role.DeviceOwner,
        roleId: 3,
        organization: mockOrganizationEntity1,
        moduleName: null,
      },
      {
        id: 4,
        firstName: 'Dev',
        lastName: 'lastName',
        email: 'testsweya6@gmail.com',
        notifications: null,
        status: UserStatus.Active,
        role: Role.OrganizationAdmin,
        roleId: 2,
        organization: mockOrganizationEntity2,
        moduleName: null,
      },
      {
        id: 5,
        firstName: 'Dev',
        lastName: 'lastName',
        email: 'testsweya4@gmail.com',
        notifications: null,
        status: UserStatus.Active,
        role: Role.User,
        roleId: 2,
        organization: mockOrganizationEntity2,
        moduleName: null,
      },
    ];

    it('should get all users when no options are provided', async () => {
      const getAllSpy = jest
        .spyOn(repository, 'find')
        .mockResolvedValue(userss as User[]);

      const users = await service.getAll();

      expect(users).toBeDefined();
      expect(users).toHaveLength(userss.length);
      expect(users).toEqual(userss);
    });

    it('should get users based on provided options', async () => {
      const getAllSpy = jest.spyOn(repository, 'find').mockResolvedValue([
        {
          id: 1,
          firstName: 'Dev',
          lastName: 'lastName',
          email: 'testsweya@gmail.com',
          notifications: null,
          status: UserStatus.Active,
          role: Role.OrganizationAdmin,
          roleId: 2,
          organization: mockOrganizationEntity1,
          moduleName: null,
        },
        {
          id: 4,
          firstName: 'Dev',
          lastName: 'lastName',
          email: 'testsweya6@gmail.com',
          notifications: null,
          status: UserStatus.Active,
          role: Role.OrganizationAdmin,
          roleId: 2,
          organization: mockOrganizationEntity2,
          moduleName: null,
        },
      ] as User[]);

      const options: FindManyOptions<User> = {
        where: {
          role: Role.OrganizationAdmin,
        },
      };

      const users = await service.getAll(options);

      await expect(getAllSpy).toHaveBeenCalledWith(options);

      expect(users).toHaveLength(2);
    });

    it('should handle empty results', async () => {
      const getAllSpy = jest.spyOn(repository, 'find').mockResolvedValue([]);

      const users = await service.getAll();

      expect(users).toHaveLength(0);
    });
  });

  describe('findById', () => {
    const mockOrganizationEntity = {
      id: 1,
      name: 'DIRECT_ORG_DEVELOPER1',
      address: 'Bangalore',
      zipCode: null,
      city: null,
      country: null,
      blockchainAccountAddress: null,
      blockchainAccountSignedMessage: null,
      orgEmail: 'testsweya@gmail.com',
      organizationType: Role.ApiUser,
      status: OrganizationStatus.Active,
      users: [],
      invitations: [],
      documentIds: [],
      api_user_id: 'apiuserId',
    } as Organization;

    const mockuserEntity = {
      id: 1,
      firstName: 'Dev',
      lastName: 'lastName',
      email: 'testsweya5@gmail.com',
      password: 'Drec@1234',
      notifications: null,
      status: UserStatus.Active,
      role: Role.ApiUser,
      roleId: 2,
      api_user_id: 'apiuserId',
      organization: mockOrganizationEntity,
      moduleName: null,
      updatedAt: new Date(),
    } as User;

    const mockApiUserEntity: ApiUserEntity = {
      api_user_id: mockuserEntity.api_user_id,
      permission_status: UserPermissionStatus.Request,
      permissionIds: [],
    };

    it('should return the user when a user with the provided ID exists', async () => {
      const userId = 1;

      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(mockuserEntity);
      jest
        .spyOn(apiUserEntityRepository, 'findOne')
        .mockResolvedValue(mockApiUserEntity);

      const user = await service.findById(userId);

      expect(findOneSpy).toHaveBeenCalledWith({ id: userId });
      expect(user).toEqual(mockuserEntity);
    });

    it('should throw NotFoundException when no user with the provided ID is found', async () => {
      const userId = 999;

      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(undefined);
      jest
        .spyOn(apiUserEntityRepository, 'findOne')
        .mockResolvedValue(mockApiUserEntity);

      await expect(service.findById(userId)).rejects.toThrow(NotFoundException);

      expect(findOneSpy).toHaveBeenCalledWith({ id: userId });
    });

    it('should include permission_status when the found user has a role of Role.ApiUser', async () => {
      const userId = 1;
      // @ts-ignore
      mockuserEntity.permission_status = UserPermissionStatus.Active;
      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(mockuserEntity);
      const permission_statusSpy = jest
        .spyOn(service, 'get_apiuser_permission_status')
        .mockResolvedValue(mockApiUserEntity);
      jest
        .spyOn(apiUserEntityRepository, 'findOne')
        .mockResolvedValue(mockApiUserEntity);

      const user = await service.findById(userId);

      expect(findOneSpy).toHaveBeenCalledWith({ id: userId });
      expect(permission_statusSpy).toHaveBeenCalledWith(
        mockuserEntity.api_user_id,
      );
      // @ts-ignore
      expect(user.permission_status).toBe(UserPermissionStatus.Request);
    });

    it('should not include permission_status when the found user has a role other than Role.ApiUser', async () => {
      const userId = 1;
      const OrganizationEntity = {
        id: 1,
        name: 'DIRECT_ORG_DEVELOPER1',
        address: 'Bangalore',
        zipCode: null,
        city: null,
        country: null,
        blockchainAccountAddress: null,
        blockchainAccountSignedMessage: null,
        orgEmail: 'testsweya@gmail.com',
        organizationType: Role.OrganizationAdmin,
        status: OrganizationStatus.Active,
        users: [],
        invitations: [],
        documentIds: [],
        api_user_id: 'apiuserId',
      } as Organization;

      const userEntity = {
        id: 1,
        firstName: 'Dev',
        lastName: 'lastName',
        email: 'testsweya5@gmail.com',
        password: 'Drec@1234',
        notifications: null,
        status: UserStatus.Active,
        role: Role.OrganizationAdmin,
        roleId: 2,
        api_user_id: 'apiuserId',
        organization: OrganizationEntity,
        moduleName: null,
        updatedAt: new Date(),
      } as User;

      const apiUserEntity: ApiUserEntity = {
        api_user_id: userEntity.api_user_id,
        permission_status: UserPermissionStatus.Request,
        permissionIds: [],
      };
      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(userEntity);
      jest
        .spyOn(apiUserEntityRepository, 'findOne')
        .mockResolvedValue(undefined);

      const user = await service.findById(userId);

      expect(findOneSpy).toHaveBeenCalledWith({ id: userId });
      // @ts-ignore
      expect(user.permission_status).toBeUndefined();
    });
  });

  describe('findByEmail', () => {
    const mockOrganizationEntity = {
      id: 1,
      name: 'DIRECT_ORG_DEVELOPER1',
      address: 'Bangalore',
      zipCode: null,
      city: null,
      country: null,
      blockchainAccountAddress: null,
      blockchainAccountSignedMessage: null,
      orgEmail: 'testsweya@gmail.com',
      organizationType: Role.ApiUser,
      status: OrganizationStatus.Active,
      users: [],
      invitations: [],
      documentIds: [],
      api_user_id: 'apiuserId',
    } as Organization;

    const mockuserEntity = {
      id: 1,
      firstName: 'Dev',
      lastName: 'lastName',
      email: 'testsweya@gmail.com',
      password: 'Drec@1234',
      notifications: null,
      status: UserStatus.Active,
      role: Role.ApiUser,
      roleId: 2,
      api_user_id: 'apiuserId',
      organization: mockOrganizationEntity,
      moduleName: null,
      updatedAt: new Date(),
    } as User;

    const mockApiUserEntity: ApiUserEntity = {
      api_user_id: mockuserEntity.api_user_id,
      permission_status: UserPermissionStatus.Request,
      permissionIds: [],
    };

    it('should return the user with the provided email', async () => {
      const email = 'testsweya@gmail.com';

      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(mockuserEntity);

      const result = await service.findByEmail(email);

      expect(result).toEqual(mockuserEntity);
      expect(findOneSpy).toHaveBeenCalledWith({ email: email.toLowerCase() });
    });

    it('should return null when no user with the provided email is found', async () => {
      const email = 'nonexistent@example.com';

      jest.spyOn(service, 'findOne').mockResolvedValue(null);

      const result = await service.findByEmail(email);

      expect(result).toBeNull();
      expect(service.findOne).toHaveBeenCalledWith({
        email: email.toLowerCase(),
      });
    });
  });

  describe('getUserAndPasswordByEmail', () => {
    const mockOrganizationEntity = {
      id: 1,
      name: 'DIRECT_ORG_DEVELOPER1',
      address: 'Bangalore',
      zipCode: null,
      city: null,
      country: null,
      blockchainAccountAddress: null,
      blockchainAccountSignedMessage: null,
      orgEmail: 'testsweya@gmail.com',
      organizationType: Role.ApiUser,
      status: OrganizationStatus.Active,
      users: [],
      invitations: [],
      documentIds: [],
      api_user_id: 'apiuserId',
    } as Organization;

    const mockuserEntity = {
      id: 1,
      firstName: 'Dev',
      lastName: 'lastName',
      email: 'testsweya@gmail.com',
      password: 'Drec@1234',
      notifications: null,
      status: UserStatus.Active,
      role: Role.ApiUser,
      roleId: 2,
      api_user_id: 'apiuserId',
      organization: mockOrganizationEntity,
      moduleName: null,
      updatedAt: new Date(),
    } as User;

    const mockApiUserEntity: ApiUserEntity = {
      api_user_id: mockuserEntity.api_user_id,
      permission_status: UserPermissionStatus.Request,
      permissionIds: [],
    };

    it('should return the user with the provided email and password', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      const findOneSpy = jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(mockuserEntity);

      const result = await service.getUserAndPasswordByEmail(email);

      expect(result).toEqual(mockuserEntity);
      expect(findOneSpy).toHaveBeenCalledWith({
        where: {
          email,
        },
        select: ['id', 'email', 'password'],
      }
      );
    });

    it('should return null when no user with the provided email is found', async () => {
      const email = 'nonexistent@example.com';

      const findOneSpy = jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(null);

      const result = await service.getUserAndPasswordByEmail(email);

      expect(result).toBeNull();
      expect(findOneSpy).toHaveBeenCalledWith({
        where: {
          email,
        },
        select: ['id', 'email', 'password'],
      }
      );
    });
  });

  describe('findOne', () => {
    const mockOrganizationEntity = {
      id: 1,
      name: 'DIRECT_ORG_DEVELOPER1',
      address: 'Bangalore',
      zipCode: null,
      city: null,
      country: null,
      blockchainAccountAddress: null,
      blockchainAccountSignedMessage: null,
      orgEmail: 'testsweya@gmail.com',
      organizationType: Role.ApiUser,
      status: OrganizationStatus.Active,
      users: [],
      invitations: [],
      documentIds: [],
      api_user_id: 'apiuserId',
    } as Organization;

    const mockuserEntity = {
      id: 1,
      firstName: 'Dev',
      lastName: 'lastName',
      email: 'testsweya@gmail.com',
      password: 'Drec@1234',
      notifications: null,
      status: UserStatus.Active,
      role: Role.ApiUser,
      roleId: 2,
      api_user_id: 'apiuserId',
      organization: mockOrganizationEntity,
      moduleName: null,
      updatedAt: new Date(),
    } as User;

    const mockApiUserEntity: ApiUserEntity = {
      api_user_id: mockuserEntity.api_user_id,
      permission_status: UserPermissionStatus.Request,
      permissionIds: [],
    };

    const mockemailConfirmationEntity = {
      id: 1,
      confirmed: true,
      token:
        'ab3bb2e439028fa3387c8959a7199f1d5646ee9805f44c5b24b0a4ae4ade3c9e4903ef646d15db71f9bac2d5fbbd38fa2d265fabfee32fddc8b8c02dc38ec63a',
      expiryTimestamp: 1708269930,
      user: mockuserEntity,
    } as EmailConfirmation;

    it('should return null if no user is found based on the provided conditions', async () => {
      const findOneSpy = jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(null);

      const result = await service.findOne({ email: mockuserEntity.email });

      expect(result).toBeNull();
      expect(findOneSpy).toHaveBeenCalledWith({
        where:
          {email: mockuserEntity.email} as FindOptionsWhere<User>,
        relations: ['organization'],
      }
      );
      expect(emailConfirmationService.get).not.toHaveBeenCalled();
    });

    it('should return the user with emailConfirmed set to true if email confirmation exists', async () => {
      const findOneSpy = jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(mockuserEntity);

      const emailConfirmationSpy = jest
        .spyOn(emailConfirmationService, 'get')
        .mockResolvedValue(mockemailConfirmationEntity);

      const result = await service.findOne({ email: 'test@example.com' });

      expect(result).toEqual(expect.objectContaining(mockuserEntity));
      expect(result.emailConfirmed).toBe(true);
      expect(findOneSpy).toHaveBeenCalledWith({
        where:
          {email: 'test@example.com'} as FindOptionsWhere<User>,
        relations: ['organization'],
      }
      );
      expect(emailConfirmationSpy).toHaveBeenCalledWith(1);
    });

    it('should return the user with emailConfirmed set to false if no email confirmation exists', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockuserEntity);

      jest.spyOn(emailConfirmationService, 'get').mockResolvedValue(null);

      const result = await service.findOne({ email: 'test@example.com' });

      expect(result).toEqual(expect.objectContaining(mockuserEntity));
      expect(result.emailConfirmed).toBe(false);
      expect(repository.findOne).toHaveBeenCalledWith({
        where:
          {email: 'test@example.com'} as FindOptionsWhere<User>,
        relations: ['organization'],
      }
      );
      expect(emailConfirmationService.get).toHaveBeenCalledWith(1);
    });
  });
});

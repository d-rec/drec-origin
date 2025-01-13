/* eslint-disable @typescript-eslint/no-unused-vars */

import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import {
  Repository,
  DeepPartial,
  FindManyOptions,
  FindConditions,
} from 'typeorm';
import { User } from './user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserRole } from './user_role.entity';
import { EmailConfirmationService } from '../email-confirmation/email-confirmation.service';
import { OauthClientCredentialsService } from './oauth_client.service';
import { OrganizationService } from '../organization/organization.service';
import { ApiUserEntity } from './api-user.entity';
import { UserLoginSessionEntity } from './user_login_session.entity';
import { CreateUserOrgDTO } from './dto/create-user.dto';
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
  let roleRepository: Repository<UserRole>;
  let emailConfirmationService: EmailConfirmationService;
  let oauthClientCredentialsService: OauthClientCredentialsService;
  let organizationService: OrganizationService;
  let apiUserEntityRepository: Repository<ApiUserEntity>;
  let userLoginSessionRepository: Repository<UserLoginSessionEntity>;

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
            newCreateUser: jest.fn(),
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
    roleRepository = module.get<Repository<UserRole>>(
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
    userLoginSessionRepository = module.get<Repository<UserLoginSessionEntity>>(
      getRepositoryToken(UserLoginSessionEntity),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('newCreateUser', () => {
    it('should create a new user with valid input data when it is not invite', async () => {
      const userData: CreateUserOrgDTO = {
        firstName: 'test',
        lastName: 'ApiUser',
        email: 'testsweya3@gmail.com',
        organizationType: 'ApiUser',
        password: 'Drec@1234',
        confirmPassword: 'Drec@1234',
        orgName: 'DIRECT_ORG_DEVELOPER1',
        orgAddress: 'Chennai',
        api_user_id: uuid(),
      } as CreateUserOrgDTO;

      const orgData: Organization = {
        id: 1,
        name: userData.orgName,
        organizationType: userData.organizationType,
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
      jest
        .spyOn(organizationService, 'newCreateUser')
        .mockResolvedValue(orgData);
      jest
        .spyOn(repository, 'save')
        .mockImplementation((user) =>
          Promise.resolve(user as DeepPartial<User> & User),
        );

      const result = await service.newCreateUser(userData);

      expect(result).toBeDefined();
      expect(service.checkForExistingUser).toHaveBeenCalledWith(
        userData.email.toLowerCase(),
      );
      expect(
        oauthClientCredentialsService.findOneByApiUserId,
      ).toHaveBeenCalledWith(userData.api_user_id);
      expect(organizationService.isNameAlreadyTaken).toHaveBeenCalledWith(
        userData.orgName,
      );
      expect(organizationService.newCreateUser).toHaveBeenCalledWith(
        expect.objectContaining({
          name: userData.orgName,
          organizationType: userData.organizationType,
          orgEmail: userData.email,
          address: userData.orgAddress,
          api_user_id: userData.api_user_id,
        }),
      );

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: userData.firstName,
          lastName: userData.lastName,
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

      const userData: CreateUserOrgDTO = {
        firstName: 'test',
        lastName: 'ApiUser',
        email: 'testsweya5@gmail.com',
        organizationType: 'ApiUser',
        password: 'Drec@1234',
        confirmPassword: 'Drec@1234',
        orgName: 'DIRECT_ORG_DEVELOPER1',
        orgAddress: 'Chennai',
        api_user_id: uuid(),
      } as CreateUserOrgDTO;

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
        api_user_id: 'apiUserId',
      } as Organization;

      const mockUserEntity = {
        id: 1,
        firstName: 'Dev',
        lastName: 'lastName',
        email: 'testsweya5@gmail.com',
        password: 'Drec@1234',
        notifications: null,
        status: UserStatus.Active,
        role: Role.OrganizationAdmin,
        roleId: 2,
        api_user_id: 'apiUserId',
        organization: mockOrganizationEntity,
        moduleName: null,
        updatedAt: new Date(),
      } as User;

      const mockEmailConfirmationEntity = {
        id: 1,
        confirmed: true,
        token:
          'ab3bb2e439028fa3387c8959a7199f1d5646ee9805f44c5b24b0a4ae4ade3c9e4903ef646d15db71f9bac2d5fbbd38fa2d265fabfee32fddc8b8c02dc38ec63a',
        expiryTimestamp: 1708269930,
        user: mockUserEntity,
      } as EmailConfirmation;

      jest.spyOn(repository, 'findOne').mockResolvedValue(mockUserEntity);
      jest
        .spyOn(emailConfirmationService, 'get')
        .mockResolvedValue(mockEmailConfirmationEntity);
      jest
        .spyOn(organizationService, 'isNameAlreadyTaken')
        .mockResolvedValue(true);

      await expect(service.newCreateUser(userData)).rejects.toThrowError(
        ConflictException,
      );
    });
  });

  describe('createUserByAdmin', () => {
    it('should throw a ConflictException if organization name already exists', async () => {
      const isNameAlreadyTakenSpy = jest
        .spyOn(organizationService, 'isNameAlreadyTaken')
        .mockResolvedValue(true);

      // Test data
      const userData: CreateUserOrgDTO = {
        firstName: 'test',
        lastName: 'ApiUser',
        email: 'testsweya5@gmail.com',
        organizationType: 'ApiUser',
        password: 'Drec@1234',
        confirmPassword: 'Drec@1234',
        orgName: 'DIRECT_ORG_DEVELOPER1',
        orgAddress: 'Chennai',
        api_user_id: uuid(),
      } as CreateUserOrgDTO;

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
        api_user_id: 'apiUserId',
      } as Organization;

      const mockUserEntity = {
        id: 1,
        firstName: 'Dev',
        lastName: 'lastName',
        email: 'testsweya5@gmail.com',
        password: 'Drec@1234',
        notifications: null,
        status: UserStatus.Active,
        role: Role.OrganizationAdmin,
        roleId: 2,
        api_user_id: 'apiUserId',
        organization: mockOrganizationEntity,
        moduleName: null,
        updatedAt: new Date(),
      } as User;

      const mockEmailConfirmationEntity = {
        id: 1,
        confirmed: true,
        token:
          'ab3bb2e439028fa3387c8959a7199f1d5646ee9805f44c5b24b0a4ae4ade3c9e4903ef646d15db71f9bac2d5fbbd38fa2d265fabfee32fddc8b8c02dc38ec63a',
        expiryTimestamp: 1708269930,
        user: mockUserEntity,
      } as EmailConfirmation;

      jest.spyOn(repository, 'findOne').mockResolvedValue(mockUserEntity);
      jest
        .spyOn(emailConfirmationService, 'get')
        .mockResolvedValue(mockEmailConfirmationEntity);

      jest
        .spyOn(organizationService, 'isNameAlreadyTaken')
        .mockResolvedValue(true);

      await expect(service.createUserByAdmin(userData)).rejects.toThrowError(
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
      api_user_id: 'apiUserId',
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
      api_user_id: 'apiUserId',
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
      api_user_id: 'apiUserId',
    } as Organization;

    const mockUserEntity = {
      id: 1,
      firstName: 'Dev',
      lastName: 'lastName',
      email: 'testsweya5@gmail.com',
      password: 'Drec@1234',
      notifications: null,
      status: UserStatus.Active,
      role: Role.ApiUser,
      roleId: 2,
      api_user_id: 'apiUserId',
      organization: mockOrganizationEntity,
      moduleName: null,
      updatedAt: new Date(),
    } as User;

    const mockApiUserEntity: ApiUserEntity = {
      api_user_id: mockUserEntity.api_user_id,
      permission_status: UserPermissionStatus.Request,
      permissionIds: [],
    };

    it('should return the user when a user with the provided ID exists', async () => {
      const userId = 1;

      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(mockUserEntity);
      jest
        .spyOn(apiUserEntityRepository, 'findOne')
        .mockResolvedValue(mockApiUserEntity);

      const user = await service.findById(userId);

      expect(findOneSpy).toHaveBeenCalledWith({ id: userId });
      expect(user).toEqual(mockUserEntity);
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
      mockUserEntity.permission_status = UserPermissionStatus.Active;
      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(mockUserEntity);
      const permissionStatusSpy = jest
        .spyOn(service, 'getApiUserPermissionStatus')
        .mockResolvedValue(mockApiUserEntity);
      jest
        .spyOn(apiUserEntityRepository, 'findOne')
        .mockResolvedValue(mockApiUserEntity);

      const user = await service.findById(userId);

      expect(findOneSpy).toHaveBeenCalledWith({ id: userId });
      expect(permissionStatusSpy).toHaveBeenCalledWith(
        mockUserEntity.api_user_id,
      );
      expect(user.permission_status).toBe(UserPermissionStatus.Request);
    });

    it('should not include permission_status when the found user has a role other than Role.ApiUser', async () => {
      const userId = 1;
      const organizationEntity = {
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
        api_user_id: 'apiUserId',
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
        api_user_id: 'apiUserId',
        organization: organizationEntity,
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
      api_user_id: 'apiUserId',
    } as Organization;

    const mockUserEntity = {
      id: 1,
      firstName: 'Dev',
      lastName: 'lastName',
      email: 'testsweya@gmail.com',
      password: 'Drec@1234',
      notifications: null,
      status: UserStatus.Active,
      role: Role.ApiUser,
      roleId: 2,
      api_user_id: 'apiUserId',
      organization: mockOrganizationEntity,
      moduleName: null,
      updatedAt: new Date(),
    } as User;

    const mockApiUserEntity: ApiUserEntity = {
      api_user_id: mockUserEntity.api_user_id,
      permission_status: UserPermissionStatus.Request,
      permissionIds: [],
    };

    it('should return the user with the provided email', async () => {
      const email = 'testsweya@gmail.com';

      const findOneSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(mockUserEntity);

      const result = await service.findByEmail(email);

      expect(result).toEqual(mockUserEntity);
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
      api_user_id: 'apiUserId',
    } as Organization;

    const mockUserEntity = {
      id: 1,
      firstName: 'Dev',
      lastName: 'lastName',
      email: 'testsweya@gmail.com',
      password: 'Drec@1234',
      notifications: null,
      status: UserStatus.Active,
      role: Role.ApiUser,
      roleId: 2,
      api_user_id: 'apiUserId',
      organization: mockOrganizationEntity,
      moduleName: null,
      updatedAt: new Date(),
    } as User;

    const mockApiUserEntity: ApiUserEntity = {
      api_user_id: mockUserEntity.api_user_id,
      permission_status: UserPermissionStatus.Request,
      permissionIds: [],
    };

    it('should return the user with the provided email and password', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      const findOneSpy = jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(mockUserEntity);

      const result = await service.getUserAndPasswordByEmail(email);

      expect(result).toEqual(mockUserEntity);
      expect(findOneSpy).toHaveBeenCalledWith({
        where: {
          email,
        },
        select: ['id', 'email', 'password'],
      });
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
      });
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
      api_user_id: 'apiUserId',
    } as Organization;

    const mockUserEntity = {
      id: 1,
      firstName: 'Dev',
      lastName: 'lastName',
      email: 'testsweya@gmail.com',
      password: 'Drec@1234',
      notifications: null,
      status: UserStatus.Active,
      role: Role.ApiUser,
      roleId: 2,
      api_user_id: 'apiUserId',
      organization: mockOrganizationEntity,
      moduleName: null,
      updatedAt: new Date(),
    } as User;

    const mockApiUserEntity: ApiUserEntity = {
      api_user_id: mockUserEntity.api_user_id,
      permission_status: UserPermissionStatus.Request,
      permissionIds: [],
    };

    const mockEmailConfirmationEntity = {
      id: 1,
      confirmed: true,
      token:
        'ab3bb2e439028fa3387c8959a7199f1d5646ee9805f44c5b24b0a4ae4ade3c9e4903ef646d15db71f9bac2d5fbbd38fa2d265fabfee32fddc8b8c02dc38ec63a',
      expiryTimestamp: 1708269930,
      user: mockUserEntity,
    } as EmailConfirmation;

    it('should return null if no user is found based on the provided conditions', async () => {
      const findOneSpy = jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(null);

      const result = await service.findOne({ email: mockUserEntity.email });

      expect(result).toBeNull();
      expect(findOneSpy).toHaveBeenCalledWith(
        { email: mockUserEntity.email } as FindConditions<User>,
        { relations: ['organization'] },
      );
      expect(emailConfirmationService.get).not.toHaveBeenCalled();
    });

    it('should return the user with emailConfirmed set to true if email confirmation exists', async () => {
      const findOneSpy = jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(mockUserEntity);

      const emailConfirmationSpy = jest
        .spyOn(emailConfirmationService, 'get')
        .mockResolvedValue(mockEmailConfirmationEntity);

      const result = await service.findOne({ email: 'test@example.com' });

      expect(result).toEqual(expect.objectContaining(mockUserEntity));
      expect(result.emailConfirmed).toBe(true);
      expect(findOneSpy).toHaveBeenCalledWith(
        { email: 'test@example.com' } as FindConditions<User>,
        { relations: ['organization'] },
      );
      expect(emailConfirmationSpy).toHaveBeenCalledWith(1);
    });

    it('should return the user with emailConfirmed set to false if no email confirmation exists', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockUserEntity);

      jest.spyOn(emailConfirmationService, 'get').mockResolvedValue(null);

      const result = await service.findOne({ email: 'test@example.com' });

      expect(result).toEqual(expect.objectContaining(mockUserEntity));
      expect(result.emailConfirmed).toBe(false);
      expect(repository.findOne).toHaveBeenCalledWith(
        { email: 'test@example.com' } as FindConditions<User>,
        { relations: ['organization'] },
      );
      expect(emailConfirmationService.get).toHaveBeenCalledWith(1);
    });
  });
});

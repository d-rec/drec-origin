/* eslint-disable @typescript-eslint/no-unused-vars */

import { Test, TestingModule } from '@nestjs/testing';
import { InvitationService } from './invitation.service';
import { UserService } from '../user/user.service';
import { MailService } from '../../mail/mail.service';
import { OrganizationService } from '../organization/organization.service';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Invitation } from './invitation.entity';
import { ILoggedInUser, IUser, OrganizationRole } from '../../models';
import { PermissionService } from '../permission/permission.service';
import {
  OrganizationInvitationStatus,
  OrganizationStatus,
  Role,
  UserStatus,
} from '../../utils/enums';
import { Organization } from '../organization/organization.entity';
import { User } from '../user/user.entity';
import { CreateUserORGDTO } from '../user/dto/create-user.dto';
import { BadRequestException } from '@nestjs/common';
import { OrganizationDTO } from '../organization/dto/organization.dto';

describe('InvitationService', () => {
  let service: InvitationService;
  let invitationRepository: Repository<Invitation>;
  let userService: UserService;
  let mailService: MailService;
  let organizationService: OrganizationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitationService,
        {
          provide: getRepositoryToken(Invitation),
          useClass: Repository,
          useValue: {
            findOne: jest.fn(),  // Mock function
            delete: jest.fn(),   // Mock function
          },
        },
        {
          provide: OrganizationService,
          useValue: {
            findOne: jest.fn(),
          } as any,
        },
        {
          provide: UserService,
          useValue: {
            findByEmail: jest.fn(),
            newcreate: jest.fn(),
            sentinvitiontoUser: jest.fn(),
            addToOrganization: jest.fn(),
            changeRole: jest.fn(),
          } as any,
        },
        {
          provide: MailService,
          useValue: {} as any,
        },
        {
          provide: PermissionService,
          useValue: {} as any,
        },
      ],
    }).compile();

    service = module.get<InvitationService>(InvitationService);
    invitationRepository = module.get<Repository<Invitation>>(
      getRepositoryToken(Invitation),
    );
    userService = module.get<UserService>(UserService);
    mailService = module.get<MailService>(MailService);
    organizationService = module.get<OrganizationService>(OrganizationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('invite', () => {/*
    it('should invite a user By admin', async () => {
      const user = {
        id: 1,
        organizationId: 1,
        email: 'aishuutech@gmail.com',
        blockchainAccountAddress: null,
        role: Role.Admin, //'Admin',
        permissions: undefined,
        api_user_id: 'dfd2f57d-f2b8-4057-bf48-c19f1a5aa944',
      };

      const email = 'cccplrtzifwzerosys@cazlp.com';
      const role = Role.User as OrganizationRole; //'DeviceOwner';
      const firstName = 'tst';
      const lastName = 'test';
      const orgId = 13;

      const mockAdminUserEntity: IUser = {
        id: 1,
        firstName: 'admin',
        lastName: 'drec',
        email: 'aishuutech@gmail.com',
        notifications: true,
        status: UserStatus.Active, //'Active',
        role: Role.Admin, //'Admin',
        roleId: 1,
        organization: {
          id: 1,
          name: 'Admin_DREC',
          address: 'Bangalore',
          zipCode: null,
          city: null,
          country: null,
          blockchainAccountAddress: null,
          blockchainAccountSignedMessage: null,
          organizationType: 'ApiUser',
          status: OrganizationStatus.Active, //'Active',
          documentIds: null,
        } as Organization,
        emailConfirmed: false,
      };

      const inviteeOrganization = {
        createdAt: '2024-03-01T07:59:03.122Z',
        updatedAt: '2024-03-01T07:59:03.122Z',
        id: 13,
        name: 'Dev____ORG',
        address: 'BLR',
        zipCode: null,
        city: null,
        country: null,
        blockchainAccountAddress: null,
        blockchainAccountSignedMessage: null,
        organizationType: 'Developer',
        orgEmail: 'mgi36509@zslsz.com',
        status: OrganizationStatus.Active, //'Active',
        documentIds: null,
        api_user_id: 'dfd2f57d-f2b8-4057-bf48-c19f1a5aa944',
        users: [],
        invitations: [
          {
            id: 2,
            email: 'uyhujjlswzfkdvoaot@cazlv.com',
            role: Role.User as OrganizationRole, //'User',
            status: OrganizationInvitationStatus.Pending, //'Pending',
            sender: 'admin drec',
            permissionId: null,
          } as Invitation,
        ],
      };

      const savedinvitedUser = {
        email: 'cccplrtzifwzerosys@cazlp.com',
        organization: {
          createdAt: '2024-03-01T07:59:03.122Z',
          updatedAt: '2024-03-01T07:59:03.122Z',
          id: 13,
          name: 'Dev____ORG',
          address: 'BLR',
          zipCode: null,
          city: null,
          country: null,
          blockchainAccountAddress: null,
          blockchainAccountSignedMessage: null,
          organizationType: 'Developer',
          orgEmail: 'mgi36509@zslsz.com',
          status: 'Active',
          documentIds: null,
          api_user_id: 'dfd2f57d-f2b8-4057-bf48-c19f1a5aa944',
          users: [[User], [User], [User]],
          invitations: [[Invitation], [Invitation]],
        },
        role: 'User',
        status: 'Pending',
        sender: 'admin drec',
        permissionId: null,
        createdAt: '2024-03-03T06:30:23.875Z',
        updatedAt: '2024-03-03T06:30:23.875Z',
        password: 'Drec@1234',
        id: 4,
      };

      const mockinvitedUser = {
        firstName: 'test',
        lastName: 'test',
        email: 'cccplrtzifwzerosys@cazlp.com',
        password:
          '$2a$08$d8IsG9Oqw5U3TVXWtEyN6.wktWKZ1ZhxHweaQ6oWqJhEL4k2SUk.S',
        notifications: true,
        status: 'Pending',
        role: 'OrganizationAdmin',
        roleId: 2,
        organization: { id: 13 },
        api_user_id: 'dfd2f57d-f2b8-4057-bf48-c19f1a5aa944',
        createdAt: '2024-03-03T06:30:23.936Z',
        updatedAt: '2024-03-03T06:30:23.936Z',
        id: 4,
      };

      const findByEmailSpy = jest
        .spyOn(userService, 'findByEmail')
        .mockResolvedValueOnce(mockAdminUserEntity as IUser)
        .mockResolvedValueOnce(null);
      const orgfindOneSpy = jest
        .spyOn(organizationService, 'findOne')
        .mockResolvedValue(inviteeOrganization as unknown as Organization);
      const inviteefindOneSpy = jest
        .spyOn(invitationRepository, 'findOne')
        .mockResolvedValue(undefined);
      const ensureIsNotMemberSpy = jest
        .spyOn(service, 'ensureIsNotMember')
        .mockImplementation();
      const saveSpy = jest
        .spyOn(invitationRepository, 'save')
        .mockResolvedValue(savedinvitedUser as any);
        const fixedRandomValues = [
          0.1, 0.9, 0.7, 0.4, 0.3, 0.5, 0.8, 0.2, 0.6, 0.9
        ]; 
      
        let callCount = 0;
        jest.spyOn(global.Math, 'random').mockImplementation(() => {
          const value = fixedRandomValues[callCount % fixedRandomValues.length];
          callCount++;
          return value;
        });
      const newcreatespy = jest
        .spyOn(userService, 'newcreate')
        .mockResolvedValue(mockinvitedUser as any);
      const sendInvitationSpy = jest
        .spyOn(userService, 'sentinvitiontoUser')
        .mockResolvedValue({
          message: 'Invitation sent successfully',
          success: true,
        });
      console.log("newcreatespy", newcreatespy);
      await expect(
        service.invite(
          user as ILoggedInUser,
          email,
          role,
          firstName,
          lastName,
          orgId,
        ),
      ).resolves.not.toThrow();
      console.log('Generated Password:', service.randPassword);
      await expect(service.randPassword).toBe('Gxdushdkl');
      await expect(findByEmailSpy).toHaveBeenCalledWith(user.email);
      await expect(orgfindOneSpy).toHaveBeenCalledWith(orgId);
      await expect(findByEmailSpy).toHaveBeenCalledWith(email.toLowerCase());
      await expect(inviteefindOneSpy).toHaveBeenCalledWith({
        where: {
          email: email,
          organization: {
            id: orgId,
          },
        },
        relations: ['organization'],
      });
      await expect(ensureIsNotMemberSpy).toHaveBeenCalledWith(
        email,
        inviteeOrganization,
      );
      await expect(saveSpy).toHaveBeenCalledWith({
        email: email,
        organization: inviteeOrganization,
        role,
        status: OrganizationInvitationStatus.Pending,
        sender: mockAdminUserEntity
          ? `${mockAdminUserEntity.firstName} ${mockAdminUserEntity.lastName}`
          : '',
      });
      await expect(newcreatespy).toHaveBeenCalledWith(
        {
          api_user_id: inviteeOrganization.api_user_id,
          firstName: firstName,
          lastName: lastName,
          email: email,
          password: 'Gxdushdkl',
          orgName: inviteeOrganization.name,
          organizationType: inviteeOrganization.organizationType,
          orgid: orgId,
        } as CreateUserORGDTO,
        UserStatus.Pending,
        true,
      );
      await expect(sendInvitationSpy).toHaveBeenCalledWith(
        {
          "api_user_id": "dfd2f57d-f2b8-4057-bf48-c19f1a5aa944",
          "email": "cccplrtzifwzerosys@cazlp.com",
          "firstName": "tst",
          "lastName": "test",
          "orgName": "Dev____ORG",
          "organizationType": "Developer",
          "orgid": 13,
          "password": "Gxdushdkl",
        },
        "cccplrtzifwzerosys@cazlp.com",
      );
      jest.spyOn(global.Math, 'random').mockRestore();
    });
*/
    it('should invite a user By ApiUser', async () => {
      const user = {
        id: 2,
        organizationId: 2,
        email: 'iceratan@gmail.com',
        blockchainAccountAddress: null,
        role: Role.ApiUser, //'Admin',
        permissions: ['Read', 'Write', 'Update'],
        api_user_id: 'ebf1a4ee-ec55-4ed6-b6bd-4c836a56ad9d',
      };

      const email = 'diuqtdpnqttfuvauha@cazlq.com';
      const role = Role.User as OrganizationRole; //'DeviceOwner';
      const firstName = 'test';
      const lastName = 'test';
      const orgId = 18;

      const mockApiUserEntity: IUser = {
        id: 2,
        firstName: 'test',
        lastName: 'apiuser',
        email: 'iceratan@gmail.com',
        notifications: true,
        status: UserStatus.Active, //'Active',
        role: Role.ApiUser, //'Admin',
        roleId: 6,
        organization: {
          id: 2,
          name: 'ORG_APIUSER1',
          address: 'Bangalore',
          zipCode: null,
          city: null,
          country: null,
          blockchainAccountAddress: null,
          blockchainAccountSignedMessage: null,
          organizationType: 'ApiUser',
          orgEmail: 'iceratan@gmail.com',
          status: OrganizationStatus.Active, //'Active',
          documentIds: null,
          api_user_id: 'ebf1a4ee-ec55-4ed6-b6bd-4c836a56ad9d',
          users: [],
          invitations: [],
        } as Organization,
        emailConfirmed: false,
      };

      const inviteeOrganization = {
        createdAt: '2024-03-01T07:59:03.122Z',
        updatedAt: '2024-03-01T07:59:03.122Z',
        id: 18,
        name: 'ORG_DEV1_APIUSER',
        address: 'BLR',
        zipCode: null,
        city: null,
        country: null,
        blockchainAccountAddress: null,
        blockchainAccountSignedMessage: null,
        organizationType: 'Developer',
        orgEmail: 'eqicgglmwppkbkugh@cazlg.com',
        status: OrganizationStatus.Active, //'Active',
        documentIds: null,
        api_user_id: 'ebf1a4ee-ec55-4ed6-b6bd-4c836a56ad9d',
        users: [
          {
            createdAt: '2024-03-03T17:18:55.416Z',
            updatedAt: '2024-03-03T17:18:55.416Z',
            id: 23,
            firstName: 'string',
            lastName: 'string',
            email: 'eqicgglmwppkbkugh@cazlg.com',
            notifications: true,
            status: 'Active',
            role: 'OrganizationAdmin',
            roleId: 2,
            api_user_id: 'ebf1a4ee-ec55-4ed6-b6bd-4c836a56ad9d',
          },
        ],
        invitations: [],
      };

      const savedinvitedUser = {
        email: 'diuqtdpnqttfuvauha@cazlq.com',
        organization: {
          createdAt: '2024-03-03T17:18:55.388Z',
          updatedAt: '2024-03-03T17:18:55.388Z',
          id: 18,
          name: 'ORG_DEV1_APIUSER',
          address: 'BLR',
          zipCode: null,
          city: null,
          country: null,
          blockchainAccountAddress: null,
          blockchainAccountSignedMessage: null,
          organizationType: 'Developer',
          orgEmail: 'eqicgglmwppkbkugh@cazlg.com',
          status: 'Active',
          documentIds: null,
          api_user_id: 'ebf1a4ee-ec55-4ed6-b6bd-4c836a56ad9d',
          users: [[User]],
          invitations: [],
        },
        role: 'User',
        status: 'Pending',
        sender: 'test apiuser',
        permissionId: null,
        createdAt: '2024-03-03T18:13:43.629Z',
        updatedAt: '2024-03-03T18:13:43.629Z',
        id: 6,
      };

      const mockinvitedUser = {
        firstName: 'test',
        lastName: 'test',
        email: 'diuqtdpnqttfuvauha@cazlq.com',
        password:
          '$2a$08$d8IsG9Oqw5U3TVXWtEyN6.wktWKZ1ZhxHweaQ6oWqJhEL4k2SUk.S',
        notifications: true,
        status: 'Pending',
        role: 'OrganizationAdmin',
        roleId: 2,
        organization: { id: 18 },
        api_user_id: 'ebf1a4ee-ec55-4ed6-b6bd-4c836a56ad9d',
        createdAt: '2024-03-03T06:30:23.936Z',
        updatedAt: '2024-03-03T06:30:23.936Z',
        id: 6,
      };

      const findByEmailSpy = jest
        .spyOn(userService, 'findByEmail')
        .mockResolvedValueOnce(mockApiUserEntity as IUser)
        .mockResolvedValueOnce(null);
      const orgfindOneSpy = jest
        .spyOn(organizationService, 'findOne')
        .mockResolvedValue(inviteeOrganization as unknown as Organization);
      const inviteefindOneSpy = jest
        .spyOn(invitationRepository, 'findOne')
        .mockResolvedValue(undefined);
      const ensureIsNotMemberSpy = jest
        .spyOn(service, 'ensureIsNotMember')
        .mockImplementation();
      const saveSpy = jest
        .spyOn(invitationRepository, 'save')
        .mockResolvedValue(savedinvitedUser as any);
      const newcreatespy = jest
        .spyOn(userService, 'newcreate')
        .mockResolvedValue(mockinvitedUser as any);
      const sendInvitationSpy = jest
        .spyOn(userService, 'sentinvitiontoUser')
        .mockResolvedValue({
          message: 'Invitation sent successfully',
          success: true,
        });

      await expect(
        service.invite(
          user as unknown as ILoggedInUser,
          email,
          role,
          firstName,
          lastName,
          orgId,
        ),
      ).resolves.not.toThrow();

      await expect(findByEmailSpy).toHaveBeenCalledWith(user.email);
      await expect(orgfindOneSpy).toHaveBeenCalledWith(orgId);
      await expect(findByEmailSpy).toHaveBeenCalledWith(email.toLowerCase());
      await expect(inviteefindOneSpy).toHaveBeenCalledWith({
        where: {
          email: email,
          organization: {
            id: orgId,
          },
        },
        relations: ['organization'],
      });
      await expect(ensureIsNotMemberSpy).toHaveBeenCalledWith(
        email,
        inviteeOrganization,
      );
      await expect(saveSpy).toHaveBeenCalledWith({
        email: email,
        organization: inviteeOrganization,
        role,
        status: OrganizationInvitationStatus.Pending,
        sender: mockApiUserEntity
          ? `${mockApiUserEntity.firstName} ${mockApiUserEntity.lastName}`
          : '',
      });
      await expect(newcreatespy).toHaveBeenCalledWith(
        {
          firstName: firstName,
          lastName: lastName,
          email: email,
          password: service.randPassword,
          orgName: inviteeOrganization.name,
          organizationType: inviteeOrganization.organizationType,
          orgid: orgId,
          api_user_id: inviteeOrganization.api_user_id,
        } as CreateUserORGDTO,
        UserStatus.Pending,
        true,
      );
    });
  });

  describe('update', () => {
    it('should throw BadRequestException if invitation does not exist', async () => {
      jest.spyOn(invitationRepository, 'findOne').mockResolvedValue(null);

      await expect(service.update({ email: 'test@example.com', status: OrganizationInvitationStatus.Accepted }, 1))
        .rejects.toThrow(BadRequestException);
    });

    it('should update invitation status if valid', async () => {
      const mockInvitation = {
        id: 1,
        email: 'test@example.com',
        status: OrganizationInvitationStatus.Pending,
        organization: { id: 1 },
        role: Role.User,
      } as Invitation;
    
      const mockUser: IUser = {
        id: 1,
        firstName: 'admin',
        lastName: 'drec',
        email: 'aishuutech@gmail.com',
        notifications: true,
        status: UserStatus.Active, //'Active',
        role: Role.Admin, //'Admin',
        roleId: 1,
        organization: {
          id: 1,
          name: 'Admin_DREC',
          address: 'Bangalore',
          zipCode: null,
          city: null,
          country: null,
          blockchainAccountAddress: null,
          blockchainAccountSignedMessage: null,
          organizationType: 'ApiUser',
          status: OrganizationStatus.Active, //'Active',
          documentIds: null,
        } as Organization,
        emailConfirmed: false,
      };
    
      jest.spyOn(invitationRepository, 'findOne').mockResolvedValue(mockInvitation);
      jest.spyOn(userService, 'findByEmail').mockResolvedValue(mockUser);
      jest.spyOn(userService, 'addToOrganization').mockResolvedValue(undefined);
      jest.spyOn(userService, 'changeRole').mockResolvedValue(undefined);
      const saveSpy = jest.spyOn(invitationRepository, 'save').mockResolvedValue(mockInvitation);
    
      await service.update(
        { email: 'test@example.com', status: OrganizationInvitationStatus.Accepted },
        1,
      );
    
      expect(saveSpy).toHaveBeenCalledWith(expect.objectContaining({
        status: OrganizationInvitationStatus.Accepted,
      }));
      expect(userService.addToOrganization).toHaveBeenCalledWith(mockUser.id, mockInvitation.organization.id);
      expect(userService.changeRole).toHaveBeenCalledWith(mockUser.id, mockInvitation.role);
    });    
  });
  describe('getUsersInvitation', () => {
    it('should return all invitations for an admin user', async () => {
      const mockInvitations = [{ id: 1 }, { id: 2 }];
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockInvitations, mockInvitations.length]),
      };
  
      jest.spyOn(invitationRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);
  
      const result = await service.getUsersInvitation({
        id: 1,
        role: Role.Admin,
        api_user_id: "ygjkgthhfrhjfjh",
        organizationId: 1,
        email: 'admin@example.com',
        blockchainAccountAddress: '0x123',
      } as ILoggedInUser);
  
      expect(result.invitations).toEqual(mockInvitations);
      expect(result.totalCount).toBe(mockInvitations.length);
    });

    it('should throw error if non-admin user tries to view other organization invitations', async () => {
      // Arrange
      const mockOrganization = {
        id: 1,
        name: 'Admin_DREC',
        address: 'Bangalore',
        zipCode: null,
        city: null,
        country: null,
        blockchainAccountAddress: null,
        blockchainAccountSignedMessage: null,
        organizationType: 'ApiUser',
        status: OrganizationStatus.Active,
        documentIds: null,
        api_user_id: 'ygjkgthhfrhjfjh',
      } as Organization;
    
      // Mock the organizationService to return a specific organization
      jest.spyOn(organizationService, 'findOne').mockResolvedValue(mockOrganization);
    
      // Mock createQueryBuilder and its chained methods
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      
      jest.spyOn(invitationRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);
    
      // Act & Assert
      await expect(
        service.getUsersInvitation(
          {
            id: 1,
            role: Role.User,  // Non-admin role
            api_user_id: 'different_api_user_id',  // Different from the organization's api_user_id
            organizationId: 2,  // Different organizationId
            email: 'user@example.com',
            blockchainAccountAddress: '0x123',
          } as ILoggedInUser,
          1  // Passing the organizationId as parameter
        )
      ).rejects.toThrow(BadRequestException);
    });    
    
    it('should return invitations for a specific organization if user has access', async () => {
      // Arrange: Prepare a mock list of invitations
      const mockInvitations = [{ id: 1 }];
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockInvitations, mockInvitations.length]),
      };
    
      jest.spyOn(invitationRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);
    
      jest.spyOn(organizationService, 'findOne').mockResolvedValue({
        id: 1,
        name: 'Admin_DREC',
        address: 'Bangalore',
        zipCode: null,
        city: null,
        country: null,
        blockchainAccountAddress: null,
        blockchainAccountSignedMessage: null,
        organizationType: 'ApiUser',
        status: OrganizationStatus.Active,
        documentIds: null,
        api_user_id: 'ygjkgthhfrhjfjh',  // Mocking this to match the user's api_user_id
      } as Organization);
    
      // Act: Call the service method with a user that has access to the organization
      const result = await service.getUsersInvitation(
        {
          id: 1,
          role: Role.ApiUser,  // Change to Role.ApiUser to match the organization’s api_user_id
          api_user_id: 'ygjkgthhfrhjfjh',  // Match the organization’s api_user_id
          organizationId: 1,  // Same organizationId as being fetched
          email: 'user@example.com',
          blockchainAccountAddress: '0x123',
        } as ILoggedInUser,
        1  // Organization ID being fetched
      );
    
      // Assert: Check if the service returns the correct invitations list and pagination info
      expect(result.invitations).toEqual(mockInvitations);
      expect(result.totalCount).toBe(mockInvitations.length);
    });

    it('should paginate correctly', async () => {
      // Arrange: Prepare a mock list of invitations
      const mockInvitations = [{ id: 1 }];
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockInvitations, 10]), // Total count of 10 for pagination
      };
    
      jest.spyOn(invitationRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);
    
      // Mocking organizationService.findOne to return a valid Organization object
      jest.spyOn(organizationService, 'findOne').mockResolvedValue({
        id: 1,
        name: 'Admin_DREC',
        address: 'Bangalore',
        zipCode: null,
        city: null,
        country: null,
        blockchainAccountAddress: null,
        blockchainAccountSignedMessage: null,
        organizationType: 'ApiUser',
        status: OrganizationStatus.Active,
        documentIds: null,
        api_user_id: 'ygjkgthhfrhjfjh',  // Matching the user's api_user_id
      } as Organization);
    
      // Act: Call the service method with pagination parameters
      const result = await service.getUsersInvitation(
        {
          id: 1,
          role: Role.ApiUser,  // Role matching organization’s api_user_id
          api_user_id: 'ygjkgthhfrhjfjh',  // Matching organization’s api_user_id
          organizationId: 1,  // Same organizationId as being fetched
          email: 'user@example.com',
          blockchainAccountAddress: '0x123',
        } as ILoggedInUser,
        1,  // Organization ID
        1,  // Page number
        5   // Limit per page
      );
    
      // Assert: Check if the service returns the correct invitations list and pagination info
      expect(result.invitations).toEqual(mockInvitations);
      expect(result.currentPage).toBe(1);  // Expect page number to be 1
      expect(result.totalPages).toBe(2);  // Total count is 10 and limit is 5, so totalPages should be 2
      expect(result.totalCount).toBe(10);  // Expect total count to be 10
    });    
  });
  
  describe('ensureIsNotMember', () => {
    it('should not throw an error if the user is not a member of the organization', () => {
      // Arrange: Prepare a mock organization without the user as a member
      const organization: Organization = {
        users: [{ email: 'user1@example.com' }, { email: 'user2@example.com' }],
        // Add other necessary properties of Organization if required
      } as any;
  
      const emailToCheck = 'notamember@example.com';
  
      // Act & Assert: Expect no exception to be thrown
      expect(() => {
        service.ensureIsNotMember(emailToCheck, organization);
      }).not.toThrow();
    });  
  });

  describe('remove', () => {
    it('should convert the email to lowercase', async () => {
      const email = 'TEST@EXAMPLE.COM';
      const orgId = 1;
  
      // Mock findOne to return null
      const findOneSpy = jest.spyOn(invitationRepository,'findOne').mockResolvedValue(null);
  
      await service.remove(email, orgId);
  
      await expect(findOneSpy).toHaveBeenCalledWith({
        where: { email: email.toLowerCase(), organization: orgId },
        relations: ['organization'],
      });
    });

    it('should find an invitee based on the email and organization ID', async () => {
      const email = 'test@example.com';
      const orgId = 1;
      const mockInvitee = { id: 1, email: 'test@example.com' };
  
      const findOneSpy = jest.spyOn(invitationRepository, 'findOne').mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        status: OrganizationInvitationStatus.Pending,
        organization: { id: 1 },
        role: Role.User,
      } as Invitation);

      const deleteSpy = jest.spyOn(invitationRepository,'delete').mockResolvedValue({ raw: [], affected: 1 })
  
      await service.remove(email, orgId);
  
      await expect(findOneSpy).toHaveBeenCalledWith({
        where: { email: email.toLowerCase(), organization: orgId },
        relations: ['organization'],
      });

      await expect(deleteSpy).toHaveBeenCalledWith(orgId);
    });

    it('should log a verbose message when an invitee is found', async () => {
      const email = 'test@example.com';
      const orgId = 1;
      const mockInvitee = { id: 1, email: 'test@example.com' };
  
      const findOneSpy = jest.spyOn(invitationRepository,'findOne').mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        status: OrganizationInvitationStatus.Pending,
        organization: { id: 1 },
        role: Role.User,
      } as Invitation);

      const deleteSpy = jest.spyOn(invitationRepository,'delete').mockResolvedValue({ raw: [], affected: 1 });
  
      await service.remove(email, orgId);

      await expect(deleteSpy).toHaveBeenCalledWith(orgId);
    });
  
    it('should delete the invitee if found', async () => {
      const email = 'test@example.com';
      const orgId = 1;
      const mockInvitee = { id: 1, email: 'test@example.com' };
  
      const findOneSpy = jest.spyOn(invitationRepository,'findOne').mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        status: OrganizationInvitationStatus.Pending,
        organization: { id: 1 },
        role: Role.User,
      } as Invitation);

      const deleteSpy = jest.spyOn(invitationRepository,'delete').mockResolvedValue({ raw: [], affected: 1 });
  
      await service.remove(email, orgId);
  
      await expect(findOneSpy).toHaveBeenCalledWith({
        where: { email: email.toLowerCase(), organization: orgId },
        relations: ['organization'],
      });
      await expect(deleteSpy).toHaveBeenCalledWith(orgId);
    });

    it('should not delete anything if the invitee is not found', async () => {
      const email = 'test@example.com';
      const orgId = 1;
  
      // Mock findOne to return null, simulating invitee not found
      jest.spyOn(invitationRepository, 'findOne').mockResolvedValue(null);
      const deleteSpy = jest.spyOn(invitationRepository, 'delete');
  
      // No need to explicitly mock 'delete' again if it's already defined in beforeEach
  
      await service.remove(email, orgId);
  
      // Ensure 'delete' was not called since the invitee was not found
      expect(deleteSpy).not.toHaveBeenCalled();
    });
  });
});

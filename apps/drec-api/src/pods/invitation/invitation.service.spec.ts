import { Test, TestingModule } from '@nestjs/testing';
import { InvitationService } from './invitation.service';
import { UserService } from '../user/user.service';
import { MailService } from '../../mail/mail.service';
import { OrganizationService } from '../organization/organization.service';
import { Repository, DeepPartial } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Invitation } from './invitation.entity';
import { ILoggedInUser, IUser, OrganizationRole } from '../../models';
import { PermissionService } from '../permission/permission.service';
import { OrganizationInvitationStatus, OrganizationStatus, Role, UserStatus } from '../../utils/enums';
import { Organization } from '../organization/organization.entity';
import { User } from '../user/user.entity';
import { CreateUserORGDTO } from '../user/dto/create-user.dto';

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
          } as any,
        },
        {
          provide: MailService,
          useValue: {} as any,
        },         {
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
    organizationService = module.get<OrganizationService>(
      OrganizationService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('invite', () => {
    it('should invite a user By admin', async () => {

      const user = {
        id: 1,
        organizationId: 1,
        email: 'aishuutech@gmail.com',
        blockchainAccountAddress: null,
        role: Role.Admin,//'Admin',
        permissions: undefined,
        api_user_id: 'dfd2f57d-f2b8-4057-bf48-c19f1a5aa944',        
       };

       const email= 'cccplrtzifwzerosys@cazlp.com';
       const role= Role.User as OrganizationRole;//'DeviceOwner';
       const firstName= 'tst';
       const lastName= 'test';
       const orgId= 13;

       const mockAdminUserEntity : IUser = {
        id: 1,
        firstName: 'admin',
        lastName: 'drec',
        email: 'aishuutech@gmail.com',
        notifications: true,
        status: UserStatus.Active,//'Active',
        role: Role.Admin,//'Admin',
        roleId: 1,
        organization :{
          id: 1,
          name: 'Admin_DREC',
          address: 'Bangalore',
          zipCode: null,
          city: null,
          country: null,
          blockchainAccountAddress: null,
          blockchainAccountSignedMessage: null,
          organizationType: 'ApiUser',
          status: OrganizationStatus.Active,//'Active',
          documentIds: null,
        } as Organization,
        emailConfirmed: false,
       };

       let inviteeOrganization = {
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
        status: OrganizationStatus.Active,//'Active',
        documentIds: null,
        api_user_id: 'dfd2f57d-f2b8-4057-bf48-c19f1a5aa944',
        users: [],
       invitations: [
       {
        id: 2,
        email: 'uyhujjlswzfkdvoaot@cazlv.com',
        role: Role.User as OrganizationRole,//'User',
        status: OrganizationInvitationStatus.Pending,//'Pending',
        sender: 'admin drec',
        permissionId: null
        } as Invitation,
       ]
      };


      let savedinvitedUser = {
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
        users: [ [User], [User], [User] ],
        invitations: [ [Invitation], [Invitation] ]
       },
       role: 'User',
       status: 'Pending',
       sender: 'admin drec',
       permissionId: null,
       createdAt: '2024-03-03T06:30:23.875Z',
       updatedAt: '2024-03-03T06:30:23.875Z',
       password: 'Drec@1234',
       id: 4
      };

      let mockinvitedUser =  {
        firstName: 'test',
        lastName: 'test',
        email: 'cccplrtzifwzerosys@cazlp.com',
        password: '$2a$08$d8IsG9Oqw5U3TVXWtEyN6.wktWKZ1ZhxHweaQ6oWqJhEL4k2SUk.S',
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

      const findByEmailSpy = jest.spyOn(userService, 'findByEmail').mockResolvedValueOnce(mockAdminUserEntity as IUser).mockResolvedValueOnce(null);
      const orgfindOneSpy = jest.spyOn(organizationService, 'findOne').mockResolvedValue(inviteeOrganization as unknown as Organization);
      const inviteefindOneSpy = jest.spyOn(invitationRepository, 'findOne').mockResolvedValue(undefined);
      const ensureIsNotMemberSpy = jest.spyOn(service, 'ensureIsNotMember').mockImplementation(() => {});
      const saveSpy = jest.spyOn(invitationRepository, 'save').mockResolvedValue(savedinvitedUser as any);
      const newcreatespy = jest.spyOn(userService, 'newcreate').mockResolvedValue(mockinvitedUser as any);
      const sendInvitationSpy = jest.spyOn(userService, 'sentinvitiontoUser').mockResolvedValue({ 
        message: 'Invitation sent successfully', 
        success: true 
      });

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

      await expect(findByEmailSpy).toHaveBeenCalledWith(user.email);
      await expect(orgfindOneSpy).toHaveBeenCalledWith(orgId);
      await expect(findByEmailSpy).toHaveBeenCalledWith(email.toLowerCase());
      await expect(inviteefindOneSpy).toHaveBeenCalledWith({where: { email: email, organization: orgId }, relations: ['organization'],});
      await expect(ensureIsNotMemberSpy).toHaveBeenCalledWith(email,inviteeOrganization);
      await expect(saveSpy).toHaveBeenCalledWith({
        email: email,
        organization: inviteeOrganization,
        role,
        status: OrganizationInvitationStatus.Pending,
        sender: mockAdminUserEntity ? `${mockAdminUserEntity.firstName} ${mockAdminUserEntity.lastName}` : '',
      });
      await expect(newcreatespy).toHaveBeenCalledWith({
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: service.randPassword,
        orgName: inviteeOrganization.name,
        organizationType: inviteeOrganization.organizationType,
        orgid: orgId,
        api_user_id: inviteeOrganization.api_user_id,
      } as CreateUserORGDTO,
      UserStatus.Pending, true,
      );
      await expect(sendInvitationSpy).toHaveBeenCalledWith({
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: service.randPassword,
        orgName: inviteeOrganization.name,
        organizationType: inviteeOrganization.organizationType,
        orgid: orgId,
        api_user_id: inviteeOrganization.api_user_id,
      } as CreateUserORGDTO,
      email, mockinvitedUser.id,
      );
    });

    it('should invite a user By ApiUser', async () => {

      const user = {
        id: 2,
        organizationId: 2,
        email: 'iceratan@gmail.com',
        blockchainAccountAddress: null,
        role: Role.ApiUser,//'Admin',
        permissions: [ 'Read', 'Write', 'Update' ],
        api_user_id: 'ebf1a4ee-ec55-4ed6-b6bd-4c836a56ad9d',        
       };

       const email= 'diuqtdpnqttfuvauha@cazlq.com';
       const role= Role.User as OrganizationRole;//'DeviceOwner';
       const firstName= 'test';
       const lastName= 'test';
       const orgId= 18;

       const mockApiUserEntity : IUser = {
        id: 2,
        firstName: 'test',
        lastName: 'apiuser',
        email: 'iceratan@gmail.com',
        notifications: true,
        status: UserStatus.Active,//'Active',
        role: Role.ApiUser,//'Admin',
        roleId: 6,
        organization :{
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
          status: OrganizationStatus.Active,//'Active',
          documentIds: null,
          api_user_id: 'ebf1a4ee-ec55-4ed6-b6bd-4c836a56ad9d',
          users: [],
          invitations: []
        } as Organization,
        emailConfirmed: false,
       };

       let inviteeOrganization = {
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
        status: OrganizationStatus.Active,//'Active',
        documentIds: null,
        api_user_id: 'ebf1a4ee-ec55-4ed6-b6bd-4c836a56ad9d',
        users: [{
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
          api_user_id: 'ebf1a4ee-ec55-4ed6-b6bd-4c836a56ad9d'
        }],
       invitations: [
       ]
      };

      
      let savedinvitedUser = {
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
        users: [ [User] ],
        invitations: []
       },
       role: 'User',
       status: 'Pending',
       sender: 'test apiuser',
       permissionId: null,
       createdAt: '2024-03-03T18:13:43.629Z',
       updatedAt: '2024-03-03T18:13:43.629Z',
       id: 6
      };

      let mockinvitedUser =  {
        firstName: 'test',
        lastName: 'test',
        email: 'diuqtdpnqttfuvauha@cazlq.com',
        password: '$2a$08$d8IsG9Oqw5U3TVXWtEyN6.wktWKZ1ZhxHweaQ6oWqJhEL4k2SUk.S',
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

      const findByEmailSpy = jest.spyOn(userService, 'findByEmail').mockResolvedValueOnce(mockApiUserEntity as IUser).mockResolvedValueOnce(null);
      const orgfindOneSpy = jest.spyOn(organizationService, 'findOne').mockResolvedValue(inviteeOrganization as unknown as Organization);
      const inviteefindOneSpy = jest.spyOn(invitationRepository, 'findOne').mockResolvedValue(undefined);
      const ensureIsNotMemberSpy = jest.spyOn(service, 'ensureIsNotMember').mockImplementation(() => {});
      const saveSpy = jest.spyOn(invitationRepository, 'save').mockResolvedValue(savedinvitedUser as any);
      const newcreatespy = jest.spyOn(userService, 'newcreate').mockResolvedValue(mockinvitedUser as any);
      const sendInvitationSpy = jest.spyOn(userService, 'sentinvitiontoUser').mockResolvedValue({ 
        message: 'Invitation sent successfully', 
        success: true 
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
      await expect(inviteefindOneSpy).toHaveBeenCalledWith({where: { email: email, organization: orgId }, relations: ['organization'],});
      await expect(ensureIsNotMemberSpy).toHaveBeenCalledWith(email,inviteeOrganization);
      await expect(saveSpy).toHaveBeenCalledWith({
        email: email,
        organization: inviteeOrganization,
        role,
        status: OrganizationInvitationStatus.Pending,
        sender: mockApiUserEntity ? `${mockApiUserEntity.firstName} ${mockApiUserEntity.lastName}` : '',
      });
      await expect(newcreatespy).toHaveBeenCalledWith({
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: service.randPassword,
        orgName: inviteeOrganization.name,
        organizationType: inviteeOrganization.organizationType,
        orgid: orgId,
        api_user_id: inviteeOrganization.api_user_id,
      } as CreateUserORGDTO,
      UserStatus.Pending, true,
      ); 
    });
  });
});
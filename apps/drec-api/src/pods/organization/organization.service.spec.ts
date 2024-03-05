import { Test, TestingModule } from '@nestjs/testing';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrganizationService } from '../organization/organization.service';
import { Organization } from './organization.entity';
import { ConfigService } from '@nestjs/config';
import { BlockchainPropertiesService } from '@energyweb/issuer-api';
import { UserService } from '../user/user.service';
import { MailService } from '../../mail/mail.service';
import { FileService } from '../file';
import { OrganizationFilterDTO } from '../admin/dto/organization-filter.dto';
import { LoggedInUser } from 'src/models';
import { OrganizationStatus, Role, UserStatus } from 'src/utils/enums';
import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import exp from 'constants';
import { User } from '../user/user.entity';


describe('OrganizationService', () => {
  let service: OrganizationService;
  let repository: Repository<Organization>;
  let configService: ConfigService;
  let blockchainPropertiesService: BlockchainPropertiesService;
  let userService: UserService;
  let mailService: MailService;
  let fileService: FileService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrganizationService,
        {
          provide: getRepositoryToken(Organization),
          useClass: Repository,
        },
        {
          provide: UserService,
          useValue: {
            findUserByOrganization: jest.fn(),
          } as any,
        },        
        ConfigService,
        {
          provide: BlockchainPropertiesService,
          useValue: {} as any,
        },
        {
          provide: MailService,
          useValue: {} as any,
        },
        {
          provide: FileService,
          useValue: {} as any,
        },
      ],
    }).compile();

    service = module.get<OrganizationService>(OrganizationService);
    repository = module.get<Repository<Organization>>(getRepositoryToken(Organization));
    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAll', ()=> {
    it('should return organizations without filtering when user is not provided', async () => {

      const filterDto: OrganizationFilterDTO = {
        organizationName: undefined
      };
      const pageNumber = 1;
      const limit = 0;
      const user = undefined;
  
      const queryMock: Partial<SelectQueryBuilder<Organization>> = {
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
  
      jest.spyOn(service, 'getFilteredQuery').mockResolvedValue(queryMock as any);   
      const result = await service.getAll(filterDto, pageNumber, limit, user);
  
      expect(result.organizations).toBeDefined();
      expect(result.currentPage).toBe(pageNumber);
      expect(result.totalPages).toEqual(NaN);
      expect(result.totalCount).toEqual(result.organizations.length);
    });
  
    it('should return organizations filtered by API user ID when user is an API user', async () => {
      const filterDto: OrganizationFilterDTO = {
        organizationName:undefined,
      };
      const pageNumber = 1;
      const limit = 10;
      const user = {
        role: Role.ApiUser,//'ApiUser',
        api_user_id: 'dfd2f57d-f2b8-4057-bf48-c19f1a5aa944'
      };
      const queryMock: Partial<SelectQueryBuilder<Organization>> = {
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
  
      jest.spyOn(service, 'getFilteredQuery').mockResolvedValue(queryMock as any);
  
      const result = await service.getAll(filterDto, pageNumber, limit, user as LoggedInUser);
  
      expect(queryMock.andWhere).toHaveBeenCalledWith(`organization.api_user_id = :apiuserid`, { apiuserid: user.api_user_id });
    });
  
    it('should throw InternalServerErrorException when an error occurs during retrieval', async () => {
  
      const filterDto: OrganizationFilterDTO = {
        organizationName: undefined,
      };
      const pageNumber = 1;
      const limit = 10;
      const user = {
        role: 'Admin',
      };
      const queryMock: Partial<SelectQueryBuilder<Organization>> = {
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockRejectedValue(new Error('Database error')),
      };
  
      jest.spyOn(service, 'getFilteredQuery').mockResolvedValue(queryMock as any);
  
      await expect(service.getAll(filterDto, pageNumber, limit, user as LoggedInUser)).rejects.toThrowError(InternalServerErrorException);
    });

    it('should return the list of organizations with filteration with pagination', async ()=> {

      const response = {
        "organizations": [
            {
                "createdAt": "2024-03-01T07:59:03.122Z",
                "updatedAt": "2024-03-01T07:59:03.122Z",
                "id": 13,
                "name": "Dev____ORG",
                "address": "BLR",
                "zipCode": null,
                "city": null,
                "country": null,
                "blockchainAccountAddress": null,
                "blockchainAccountSignedMessage": null,
                "organizationType": "Developer",
                "orgEmail": "mgi36509@zslsz.com",
                "status": "Active",
                "documentIds": null,
                "api_user_id": "dfd2f57d-f2b8-4057-bf48-c19f1a5aa944",
                "users": [
                    {
                        "createdAt": "2024-03-01T07:59:03.148Z",
                        "updatedAt": "2024-03-01T07:59:03.148Z",
                        "id": 14,
                        "firstName": "test",
                        "lastName": "test",
                        "email": "mgi36509@zslsz.com",
                        "notifications": true,
                        "status": "Active",
                        "role": "OrganizationAdmin",
                        "roleId": 2,
                        "api_user_id": "dfd2f57d-f2b8-4057-bf48-c19f1a5aa944"
                    },
                    {
                        "createdAt": "2024-03-02T16:45:15.601Z",
                        "updatedAt": "2024-03-02T16:45:15.601Z",
                        "id": 18,
                        "firstName": "test",
                        "lastName": "test",
                        "email": "uyhujjlswzfkdvoaot@cazlv.com",
                        "notifications": true,
                        "status": "Pending",
                        "role": "OrganizationAdmin",
                        "roleId": 2,
                        "api_user_id": "dfd2f57d-f2b8-4057-bf48-c19f1a5aa944"
                    },
                    {
                        "createdAt": "2024-03-02T17:12:01.027Z",
                        "updatedAt": "2024-03-02T17:12:01.027Z",
                        "id": 19,
                        "firstName": "tst",
                        "lastName": "test",
                        "email": "scjiujrqomsqcgwqkb@cazlp.com",
                        "notifications": true,
                        "status": "Pending",
                        "role": "OrganizationAdmin",
                        "roleId": 2,
                        "api_user_id": "dfd2f57d-f2b8-4057-bf48-c19f1a5aa944"
                    },
                    {
                        "createdAt": "2024-03-03T06:30:23.936Z",
                        "updatedAt": "2024-03-03T06:30:23.936Z",
                        "id": 20,
                        "firstName": "test",
                        "lastName": "test",
                        "email": "zqiscghgjyvfusuypl@cazlv.com",
                        "notifications": true,
                        "status": "Pending",
                        "role": "OrganizationAdmin",
                        "roleId": 2,
                        "api_user_id": "dfd2f57d-f2b8-4057-bf48-c19f1a5aa944"
                    },
                    {
                        "createdAt": "2024-03-03T15:23:29.222Z",
                        "updatedAt": "2024-03-04T07:03:46.336Z",
                        "id": 21,
                        "firstName": "abc",
                        "lastName": "abctss",
                        "email": "test@gmail.com",
                        "notifications": true,
                        "status": "Pending",
                        "role": "OrganizationAdmin",
                        "roleId": 2,
                        "api_user_id": "dfd2f57d-f2b8-4057-bf48-c19f1a5aa944"
                    }
                ]
            }
        ],
        "currentPage": 1,
        "totalPages": 1,
        "totalCount": 1
    };
    
      const filterDto = {
        organizationName: 'DEV__ORG',
      };  
      const pageNumber = 1;
      const limit = 10;
      const user = {
        role: 'Admin',
      };
      
      const queryMock: Partial<SelectQueryBuilder<Organization>> = {
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
  
      const getFilteredQuerySpy = jest.spyOn(service, 'getFilteredQuery').mockImplementation(async (filterDto) => {
        return queryMock as any;
      });
  
      const result = await service.getAll(filterDto, pageNumber, limit, user as LoggedInUser);
      
      expect(getFilteredQuerySpy).toHaveBeenCalledWith(filterDto);
      console.log(result);
      await expect(result).toEqual({
        organizations: [],
        currentPage: 1,
        totalPages: 0,
        totalCount: 0,
      });
      await expect(result.organizations).toBeDefined();
    });
  });

  describe('findOne', ()=> {
    it('should find an organization with id and conditions', async()=> {
      const id = 13;
 
      const organization= {
      //"createdAt": "2024-03-01T07:59:03.122Z",
      //"updatedAt": "2024-03-01T07:59:03.122Z",
      "id": 13,
      "name": "Dev____ORG",
      "address": "BLR",
      "zipCode": null,
      "city": null,
      "country": null,
      "blockchainAccountAddress": null,
      "blockchainAccountSignedMessage": null,
      "organizationType": "Developer",
      "orgEmail": "mgi36509@zslsz.com",
      "status": OrganizationStatus.Active,//"Active",
      "documentIds": null,
      "api_user_id": "dfd2f57d-f2b8-4057-bf48-c19f1a5aa944",
      "users": [
        ],
        invitations:[],
      } as Organization;
 
      const options = {
        where:  {
          api_user_id: "dfd2f57d-f2b8-4057-bf48-c19f1a5aa944",
        },
      };
 
      jest.spyOn(repository, 'findOne').mockImplementation(async () => organization as any);
      const result = await service.findOne(id, options);
 
      expect(result).toEqual(organization);
      expect(repository.findOne).toHaveBeenCalledWith(id, options);
    });

    it('should throw NotFoundException when organization is not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(undefined);
      await expect(service.findOne(999)).rejects.toThrowError(NotFoundException);
    });
  });

  describe('findOrganizationUsers', () => {
    let orgId = 13;
    let pageNumber = 1;
    let limit = 20;
    let role = undefined;

    let users = [{
      //createdAt: '2024-03-03T15:23:29.222Z',
      updatedAt: new Date('2024-03-04T07:03:46.336Z'),
      id: 21,
      firstName: 'abc',
      lastName: 'abctss',
      email: 'test@gmail.com',
      notifications: true,
      status: UserStatus.Pending,//'Pending',
      role: Role.OrganizationAdmin,//'OrganizationAdmin',
      roleId: 2,
      api_user_id: 'dfd2f57d-f2b8-4057-bf48-c19f1a5aa944',
       organization:{
        //createdAt: '2024-03-01T07:59:03.122Z',
        //updatedAt: '2024-03-01T07:59:03.122Z',
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
        invitations: [],
        } as Organization,
        password: 'Drec@1234',
        moduleName: 'any ModuleName',
      } as User,
      {
      //createdAt: '2024-03-03T06:30:23.936Z',
      updatedAt: new Date('2024-03-03T06:30:23.936Z'),
      id: 20,
      firstName: 'test',
      lastName: 'test',
      email: 'zqiscghgjyvfusuypl@cazlv.com',
      notifications: true,
      status: UserStatus.Pending,//'Pending',
      role: Role.OrganizationAdmin,//'OrganizationAdmin',
      roleId: 2,
      api_user_id: 'dfd2f57d-f2b8-4057-bf48-c19f1a5aa944',
        organization: {
          //createdAt: '2024-03-01T07:59:03.122Z',
          //updatedAt: '2024-03-01T07:59:03.122Z',
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
          api_user_id: 'dfd2f57d-f2b8-4057-bf48-c19f1a5aa944'
        } as Organization,
        password: 'Drec@1234',
        moduleName: 'any Module',
      } as User,
      {
        //createdAt: '2024-03-02T17:12:01.027Z',
        updatedAt: new Date('2024-03-02T17:12:01.027Z'),
        id: 19,
        firstName: 'tst',
        lastName: 'test',
        email: 'scjiujrqomsqcgwqkb@cazlp.com',
        notifications: true,
        status: UserStatus.Pending,//'Pending',
        role: Role.OrganizationAdmin,//'OrganizationAdmin',
        roleId: 2,
        api_user_id: 'dfd2f57d-f2b8-4057-bf48-c19f1a5aa944',
        organization: {
          //createdAt: '2024-03-01T07:59:03.122Z',
          //updatedAt: '2024-03-01T07:59:03.122Z',
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
          api_user_id: 'dfd2f57d-f2b8-4057-bf48-c19f1a5aa944'
        } as Organization,
        password: 'Drec@1234',
        moduleName: 'anyModule',
      } as User,
      {
       //createdAt: '2024-03-02T16:45:15.601Z',
       updatedAt: new Date('2024-03-02T16:45:15.601Z'),
       id: 18,
       firstName: 'test',
       lastName: 'test',
       email: 'uyhujjlswzfkdvoaot@cazlv.com',
       notifications: true,
       status: UserStatus.Pending,//'Pending',
       role: Role.OrganizationAdmin,//'OrganizationAdmin',
       roleId: 2,
       api_user_id: 'dfd2f57d-f2b8-4057-bf48-c19f1a5aa944',
         organization: {
          //createdAt: '2024-03-01T07:59:03.122Z',
          //updatedAt: '2024-03-01T07:59:03.122Z',
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
          api_user_id: 'dfd2f57d-f2b8-4057-bf48-c19f1a5aa944'
        } as Organization,
        password: 'Drec@1234',
        moduleName: 'any Module',
      } as User,
      {
        //createdAt: '2024-03-01T07:59:03.148Z',
        updatedAt: new Date('2024-03-01T07:59:03.148Z'),
        id: 14,
        firstName: 'test',
        lastName: 'test',
        email: 'mgi36509@zslsz.com',
        notifications: true,
        status: UserStatus.Active,//'Active',
        role: Role.OrganizationAdmin,//'OrganizationAdmin',
        roleId: 2,
        api_user_id: 'dfd2f57d-f2b8-4057-bf48-c19f1a5aa944',
        organization: {
          //createdAt: '2024-03-01T07:59:03.122Z',
          //updatedAt: '2024-03-01T07:59:03.122Z',
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
          api_user_id: 'dfd2f57d-f2b8-4057-bf48-c19f1a5aa944'
        } as Organization,
        password: 'Drec@1234',
        moduleName: 'any Module',
      } as User,
    ];
    let totalCount = 5;
    it('should return the list of users for a valid organization ID', async () => {

      jest.spyOn(userService, 'findUserByOrganization').mockResolvedValue([users,totalCount] as any);

      const result = await service.findOrganizationUsers(orgId, pageNumber, limit);

      expect(result.users).toEqual(users);
      expect(result.totalCount).toBe(totalCount);
    });

    it('should filter users based on the provided role parameter', async () => {
      jest.spyOn(userService, 'findUserByOrganization').mockResolvedValue([users, totalCount] as any);

      const result = await service.findOrganizationUsers(orgId, pageNumber, limit, Role.OrganizationAdmin);

      expect(result.users).toEqual(users);
    });

    it('should return empty array when the organization is not found', async () => {
      jest.spyOn(userService, 'findUserByOrganization').mockResolvedValue([[],0] as any);

      const result = await service.findOrganizationUsers(999, pageNumber, limit);

      expect(result.users).toEqual([]);
      expect(result.currentPage).toBe(1);
      expect(result.totalPages).toBe(0);
      expect(result.totalCount).toBe(0);
    });

    it('should handle edge cases when page number is out of bounds', async () => {
      jest.spyOn(userService, 'findUserByOrganization').mockResolvedValue([[],0] as any);

      // Assuming there are only 2 users in total and page size is 10
      const result = await service.findOrganizationUsers(orgId, 100, 10);

      expect(result.users).toEqual([]);
      expect(result.currentPage).toBe(100); // Current page should still be 100
    });
  });
});
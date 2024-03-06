import { Test, TestingModule } from '@nestjs/testing';
import { OauthClientCredentialsService } from './oauth_client.service';
import { Repository, DeepPartial } from 'typeorm';
import { OauthClientCredentials } from './oauth_client_credentials.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ApiUserEntity } from './api-user.entity';
import { v4 as uuid } from 'uuid';
import { OrganizationStatus, Role, UserPermissionStatus, UserStatus } from '../../utils/enums';


describe('OauthClientCredentialsService', () => {
  let service: OauthClientCredentialsService;
  let repository:Repository<OauthClientCredentials>;
  let apiUserEntityRepository: Repository<ApiUserEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OauthClientCredentialsService,
        {
          provide: getRepositoryToken(OauthClientCredentials),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(ApiUserEntity),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<OauthClientCredentialsService>(OauthClientCredentialsService);
    repository = module.get<Repository<OauthClientCredentials>>(getRepositoryToken(OauthClientCredentials));
    apiUserEntityRepository = module.get<Repository<ApiUserEntity>>(getRepositoryToken(ApiUserEntity));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAPIUser', ()=> {
    it('should save an API user with a generated UUID', async () => {
      const mockApiUserEntity: DeepPartial<ApiUserEntity> = {
        api_user_id: uuid(),
        permission_status: UserPermissionStatus.Request,
      };
      const saveSpy = jest.spyOn(apiUserEntityRepository, 'save').mockResolvedValue(mockApiUserEntity as any);
      const result = await service.createAPIUser();
      
      expect(saveSpy).toHaveBeenCalledWith({ api_user_id: expect.any(String) });

      expect(result).toEqual(mockApiUserEntity);
    });
  });

  describe('get', () => {
    const api_user_id= uuid();
      const mockClientCredentialEntity: DeepPartial<OauthClientCredentials> = {
        id: 1,
        api_user_id: api_user_id,
        client_id: 'Some Client Credential Entity',
        user: {
          id: 1,
          firstName: 'testfName',
          lastName: 'testlName',
          email: 'testsweya1@gmail.com',
          password: 'Drec@1234',
          notifications: null,
          status: UserStatus.Active,
          role: Role.ApiUser,
          roleId: 6,
          organization: {
            id: 1,
            name: 'ORG_APIUSER',
            address: 'any address',
            organizationType: Role.ApiUser,
            orgEmail: 'testsweya1@gmail.com',
            status: OrganizationStatus.Active,
            api_user_id: api_user_id,
          },
          moduleName: null,
          api_user_id: api_user_id,
          updatedAt: new Date(),
        }
      };
    it('should return the entity with the provided api_user_id', async () => {
      
      const findOneSpy = jest.spyOn(repository, 'findOne').mockResolvedValue(mockClientCredentialEntity as any);

      const result = await service.get(mockClientCredentialEntity.api_user_id);

      expect(findOneSpy).toHaveBeenCalledWith({ api_user_id: mockClientCredentialEntity.api_user_id });

      expect(result).toEqual(mockClientCredentialEntity);
    });

    it('should return null if entity with the provided api_user_id is not found', async () => {

      const findOneSpy = jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      const result = await service.get('af8af558-ce8a-419e-a2fb-1ba225ffd813');

      expect(findOneSpy).toHaveBeenCalledWith({ api_user_id: 'af8af558-ce8a-419e-a2fb-1ba225ffd813' });

      expect(result).toBeNull(); 
    });
  });

  describe('store', () => {
    const api_user_id= uuid();
    const mockClientCredentialEntity: DeepPartial<OauthClientCredentials> = {
      id: 1,
      api_user_id: api_user_id,
      client_id: 'Some Client Credential Entity',
      user: {
        id: 1,
        firstName: 'testfName',
        lastName: 'testlName',
        email: 'testsweya1@gmail.com',
        password: 'Drec@1234',
        notifications: null,
        status: UserStatus.Active,
        role: Role.ApiUser,
        roleId: 6,
        organization: {
          id: 1,
          name: 'ORG_APIUSER',
          address: 'any address',
          organizationType: Role.ApiUser,
          orgEmail: 'testsweya1@gmail.com',
          status: OrganizationStatus.Active,
          api_user_id: api_user_id,
        },
        moduleName: null,
        api_user_id: api_user_id,
        updatedAt: new Date(),
      }
    };

    it('should store client credentials successfully', async () => {
      const saveSpy = jest.spyOn(repository, 'save').mockResolvedValue(mockClientCredentialEntity as any);
      const result = await service.store(mockClientCredentialEntity.client_id, mockClientCredentialEntity.api_user_id);
      expect(saveSpy).toHaveBeenCalledWith({ client_id: expect.any(String), api_user_id: expect.any(String) });
      expect(result).toEqual(mockClientCredentialEntity);
    });
  
    it('should store the correct client_id', async () => {
      const saveSpy = jest.spyOn(repository, 'save').mockResolvedValue(mockClientCredentialEntity as any);
      const result = await service.store(mockClientCredentialEntity.client_id, mockClientCredentialEntity.api_user_id);
      expect(saveSpy).toHaveBeenCalledWith({ client_id: expect.any(String), api_user_id: expect.any(String) });
      expect(result.client_id).toEqual(mockClientCredentialEntity.client_id);
    });
  
    it('should store the correct api_user_id', async () => {
      const saveSpy = jest.spyOn(repository, 'save').mockResolvedValue(mockClientCredentialEntity as any);
      const result = await service.store(mockClientCredentialEntity.client_id, mockClientCredentialEntity.api_user_id);
      expect(saveSpy).toHaveBeenCalledWith({ client_id: expect.any(String), api_user_id: expect.any(String) });
      expect(result.api_user_id).toEqual(mockClientCredentialEntity.api_user_id);
    });
  });

  describe('findOneByApiUserId', ()=> {
    const mockApiUserEntity: DeepPartial<ApiUserEntity> = {
      api_user_id: uuid(),
      permission_status: UserPermissionStatus.Request,
    };

    it('should find an API user by its ID', async () => {
      const findOneSpy = jest.spyOn(apiUserEntityRepository, 'findOne').mockResolvedValue(mockApiUserEntity as any);
      
      const result = await service.findOneByApiUserId(mockApiUserEntity.api_user_id);

      expect(findOneSpy).toHaveBeenCalledWith({ where: { api_user_id: mockApiUserEntity.api_user_id } });
      expect(result).toBeDefined();
    });
  
    it('should return an API user with the correct api_user_id', async () => {
      const findOneSpy = jest.spyOn(apiUserEntityRepository, 'findOne').mockResolvedValue(mockApiUserEntity as any);
      
      const result = await service.findOneByApiUserId(mockApiUserEntity.api_user_id);

      expect(findOneSpy).toHaveBeenCalledWith({ where: { api_user_id: mockApiUserEntity.api_user_id } });
      expect(result.api_user_id).toEqual(mockApiUserEntity.api_user_id);
    });
  
    it('should handle an empty api_user_id', async () => {
      await expect(service.findOneByApiUserId('')).rejects.toThrow();
    });
  
    it('should handle a non-existent api_user_id', async () => {
      const mockApiUserEntity: ApiUserEntity = undefined;
      const findOneSpy = jest.spyOn(apiUserEntityRepository, 'findOne').mockResolvedValue(mockApiUserEntity as any);
      const result = await service.findOneByApiUserId('dfd2f57d-f2b8-4057-bf48-c19f1a5aa949');
      expect(findOneSpy).toHaveBeenCalledWith({ where: { api_user_id: 'dfd2f57d-f2b8-4057-bf48-c19f1a5aa949' } });
      expect(result).toBeUndefined();
    });
  });
});

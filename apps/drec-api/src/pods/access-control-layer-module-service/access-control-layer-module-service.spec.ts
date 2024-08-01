import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AccessControlLayerModuleServiceService } from './access-control-layer-module-service.service';
import { AClModules } from './aclmodule.entity';
import { DecimalPermissionValue } from './common/permissionBitposition';
import { ACLModuleDTO, NewACLModuleDTO } from './dto/aclmodule.dto';
import { RoleStatus } from 'src/utils/enums';

describe('AccessControlLayerModuleServiceService', () => {
  let service: AccessControlLayerModuleServiceService;
  let repository: Repository<AClModules>;
  let Permissionvalue: DecimalPermissionValue;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccessControlLayerModuleServiceService,
        {
          provide: getRepositoryToken(AClModules),
          useClass: Repository,
        },
        {
          provide: DecimalPermissionValue,
          useValue: {} as any,
        },
      ],
    }).compile();

    service = module.get<AccessControlLayerModuleServiceService>(
      AccessControlLayerModuleServiceService,
    );
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    repository = module.get<Repository<AClModules>>(
      getRepositoryToken(AClModules),
    );
    Permissionvalue = module.get<DecimalPermissionValue>(
      DecimalPermissionValue,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new ACL module', async () => {
      const newModule: NewACLModuleDTO = {
        name: 'Test Module',
        status: RoleStatus.Enable,
        description: 'description of test module',
        permissions: ['Read', 'Write'],
        permissionsValue: 1,
      };

      const savedModule: ACLModuleDTO = {
        id: 1,
        ...newModule,
        permissionsValue: 3,
      };

      jest.spyOn(repository, 'save')

      repository.save.mockResolvedValue(savedModule);
      repository.findOne.mockResolvedValue(null);
      Permissionvalue.computePermissions.mockResolvedValue(3);

      const result = await service.create(newModule);

      expect(result).toEqual(savedModule);
      expect(repository.save).toHaveBeenCalledWith({
        ...newModule,
        permissionsValue: 3,
      });
    });

    it('should throw a conflict exception if module already exists', async () => {
      const newModule: NewACLModuleDTO = {
        name: 'Test Module',
        permissions: ['Read', 'Write'],
      };

      repository.findOne.mockResolvedValue(newModule);

      await expect(service.create(newModule)).rejects.toThrow(ConflictException);
    });
  });

  describe('findById', () => {
    it('should return the module if found', async () => {
      const module = { id: 1, name: 'Test Module', permissions: ['Read'] };

      repository.findOne.mockResolvedValue(module);

      const result = await service.findById(1);

      expect(result).toEqual(module);
    });

    it('should throw a not found exception if module not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findById(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAll', () => {
    it('should return all modules', async () => {
      const modules = [
        { id: 1, name: 'Test Module 1', permissions: ['Read'] },
        { id: 2, name: 'Test Module 2', permissions: ['Write'] },
      ];

      repository.find.mockResolvedValue(modules);

      const result = await service.getAll();

      expect(result).toEqual(modules);
    });
  });

  describe('update', () => {
    it('should update an existing module', async () => {
      const updateData: UpdateACLModuleDTO = {
        permissions: ['Read', 'Update'],
      };

      const existingModule = {
        id: 1,
        name: 'Test Module',
        permissions: ['Read', 'Write'],
      };

      repository.findOne.mockResolvedValue(existingModule);
      permissionValue.computePermissions.mockResolvedValue(5);

      const updatedModule = {
        ...existingModule,
        ...updateData,
        permissionsValue: 5,
      };

      repository.update.mockResolvedValue(updatedModule);

      const result = await service.update(1, updateData);

      expect(result).toEqual(updatedModule);
      expect(repository.update).toHaveBeenCalledWith(1, {
        permissions: updateData.permissions,
        permissionsValue: 5,
      });
    });

    it('should throw a not found exception if module not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.update(1, { permissions: ['Read'] })).rejects.toThrow(NotFoundException);
    });
  });
});

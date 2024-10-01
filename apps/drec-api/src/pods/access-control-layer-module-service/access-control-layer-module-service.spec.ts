import { Test, TestingModule } from '@nestjs/testing';
import { Repository, DeepPartial } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AccessControlLayerModuleServiceService } from './access-control-layer-module-service.service';
import { AClModules } from './aclmodule.entity';
import { DecimalPermissionValue } from './common/permissionBitposition';
import {
  ACLModuleDTO,
  NewACLModuleDTO,
  UpdateACLModuleDTO,
} from './dto/aclmodule.dto';
import { RoleStatus } from 'src/utils/enums';
import { ConflictException, NotFoundException } from '@nestjs/common';

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
          useValue: {
            save: jest.fn(), // Mock repository methods
            findOne: jest.fn(),
            update: jest.fn(),
            find: jest.fn(),
          } as any,
        },
        {
          provide: DecimalPermissionValue,
          useValue: {
            computePermissions: jest.fn(),
          } as any,
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

      const savedModule = {
        id: 1,
        ...newModule,
      } as AClModules;

      const saveSpy = jest
        .spyOn(repository, 'save')
        .mockResolvedValue(savedModule);
      const findOneSpy = jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(null);
      const computePermissionsSpy = jest
        .spyOn(Permissionvalue, 'computePermissions')
        .mockReturnValue(3);

      const result = await service.create(newModule);

      expect(result).toEqual(savedModule);
      expect(saveSpy).toHaveBeenCalledWith({
        ...newModule,
        permissionsValue: 3,
      });
    });

    it('should throw a conflict exception if module already exists', async () => {
      const newModule: NewACLModuleDTO = {
        name: 'Test Module',
        status: RoleStatus.Enable,
        description: 'description of test module',
        permissions: ['Read', 'Write'],
        permissionsValue: 1,
      };

      const savedModule = {
        id: 1,
        ...newModule,
      } as AClModules;

      const findOneSpy = jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(savedModule);

      await expect(service.create(newModule)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findById', () => {
    it('should return the module if found', async () => {
      const newModule: NewACLModuleDTO = {
        name: 'Test Module',
        status: RoleStatus.Enable,
        description: 'description of test module',
        permissions: ['Read', 'Write'],
        permissionsValue: 1,
      };

      const savedModule = {
        id: 1,
        ...newModule,
      } as AClModules;

      const findOneSpy = jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(savedModule);

      const result = await service.findById(1);

      expect(result).toEqual(savedModule);
    });
  });

  describe('getAll', () => {
    it('should return all modules', async () => {
      const modules = [
        {
          id: 1,
          name: 'Test Module 1',
          permissions: ['Read'],
          status: RoleStatus.Enable,
          description: 'description of test module 1',
          permissionsValue: 1,
        },
        {
          id: 2,
          name: 'Test Module 2',
          permissions: ['Write'],
          status: RoleStatus.Enable,
          description: 'description of test module 2',
          permissionsValue: 1,
        },
      ] as AClModules[];

      const findSpy = jest.spyOn(repository, 'find').mockResolvedValue(modules);

      const result = await service.getAll();

      expect(result).toEqual(modules);
    });
  });

  describe('update', () => {
    it('should update an existing module', async () => {
      const updateData: UpdateACLModuleDTO = {
        name: 'Test Module',
        status: RoleStatus.Enable,
        description: 'description of test module',
        permissions: ['Read', 'Write'],
        permissionsValue: 1,
      };

      const existingModule = {
        id: 1,
        ...updateData,
      } as AClModules;

      const findOneSpy = jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(existingModule);
      const computePermissionsSpy = jest
        .spyOn(Permissionvalue, 'computePermissions')
        .mockReturnValue(5);

      const updateResult = {
        generatedMaps: [],
        raw: [],
        affected: 1, // number of affected rows
      };

      const updateSpy = jest
        .spyOn(repository, 'update')
        .mockResolvedValue(updateResult);
      jest.spyOn(repository, 'findOne').mockResolvedValue(existingModule);

      const result = await service.update(1, updateData);

      expect(result).toEqual(existingModule);
      expect(updateSpy).toHaveBeenCalledWith(1, {
        permissions: updateData.permissions,
        permissionsValue: 5,
      });
    });
  });
});

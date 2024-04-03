import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PermissionService } from './permission.service';
import { ACLModulePermissions } from './permission.entity';
import { AccessControlLayerModuleServiceService } from '../access-control-layer-module-service/access-control-layer-module-service.service';
import { UserService } from '../user/user.service';
import { DecimalPermissionValue } from '../access-control-layer-module-service/common/permissionBitposition';

describe('PermissionService', () => {
  let service: PermissionService;
  let repository: Repository<ACLModulePermissions>;
  let ACLpermissionService: AccessControlLayerModuleServiceService;
  let userService: UserService;
  let permissionValue: DecimalPermissionValue;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionService,
        {
          provide: getRepositoryToken(ACLModulePermissions),
          useClass: Repository,
        },
        {
          provide: AccessControlLayerModuleServiceService,
          useValue: {} as any,
        },
        {
          provide: UserService,
          useValue: {} as any,
        },
        {
          provide: DecimalPermissionValue,
          useValue: {} as any,
        },
      ],
    }).compile();

    service = module.get<PermissionService>(PermissionService);
    repository = module.get<Repository<ACLModulePermissions>>(
      getRepositoryToken(ACLModulePermissions),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

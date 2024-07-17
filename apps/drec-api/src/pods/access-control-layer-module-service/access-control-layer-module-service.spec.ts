import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AccessControlLayerModuleServiceService } from './access-control-layer-module-service.service';
import { AClModules } from './aclmodule.entity';
import { DecimalPermissionValue } from './common/permissionBitposition';

describe('AccessControlLayerModuleServiceService', () => {
  let service: AccessControlLayerModuleServiceService;
  let repository: Repository<AClModules>;

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
    repository = module.get<Repository<AClModules>>(
      getRepositoryToken(AClModules),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrganizationService } from '../organization/organization.service';
import { Organization } from './organization.entity';
import { ConfigService } from '@nestjs/config';
import { BlockchainPropertiesService } from '@energyweb/issuer-api';
import { UserService } from '../user/user.service';
import { MailService } from '../../mail/mail.service';
import { FileService } from '../file';


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
          useValue: {} as any,
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
});
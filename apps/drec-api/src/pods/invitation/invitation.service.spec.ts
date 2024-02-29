import { Test, TestingModule } from '@nestjs/testing';
import { InvitationService } from './invitation.service';
import { UserService } from '../user/user.service';
import { MailService } from '../../mail/mail.service';
import { OrganizationService } from '../organization/organization.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Invitation } from './invitation.entity';
import { ResponseSuccess } from '../../models';
import { PermissionService } from '../permission/permission.service';
import { Role, UserStatus } from '../../utils/enums';
import { User } from '../user/user.entity';

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
          useValue: {} as any,
        },
        {
          provide: UserService,
          useValue: {} as any,
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
});

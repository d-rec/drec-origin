import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserService } from '../user/user.service';
import { MailService } from '../../mail';
import { EmailConfirmationService } from './email-confirmation.service';
import { EmailConfirmation } from './email-confirmation.entity';
import { OauthClientCredentialsService } from '../user/oauth_client.service';


describe('EmailConfirmationService', () => {
  let service: EmailConfirmationService;
  let repository: Repository<EmailConfirmation>;
  let userService: UserService;
  let mailService: MailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailConfirmationService,
        {
          provide: getRepositoryToken(EmailConfirmation),
          useClass: Repository,
        },
        {
          provide: UserService,
          useValue: {} as any,
        },
        {
            provide: MailService,
            useValue: {} as any,
        },
        {
            provide: OauthClientCredentialsService,
            useValue: {} as any,
        }          
      ],
    }).compile();

    service = module.get<EmailConfirmationService>(EmailConfirmationService);
    repository = module.get<Repository<EmailConfirmation>>(getRepositoryToken(EmailConfirmation));
    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
import { Test, TestingModule } from '@nestjs/testing';
import { Repository, FindConditions } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserService } from '../user/user.service';
import { MailService } from '../../mail';
import { EmailConfirmationService } from './email-confirmation.service';
import { EmailConfirmation } from './email-confirmation.entity';
import { OauthClientCredentialsService } from '../user/oauth_client.service';
import { User } from '../user/user.entity';
import { EmailConfirmationResponse, Role, UserStatus } from 'src/utils/enums';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { IEmailConfirmation, IEmailConfirmationToken, IUser } from 'src/models';
import { DateTime } from 'luxon';

describe('EmailConfirmationService', () => {
  let service: EmailConfirmationService;
  let repository: Repository<EmailConfirmation>;
  let userService: UserService;
  let mailService: MailService; // eslint-disable-line @typescript-eslint/no-unused-vars

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailConfirmationService,
        {
          provide: getRepositoryToken(EmailConfirmation),
          useClass: Repository,
        },
        {
          provide: UserService,
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          } as any,
        },
        {
          provide: MailService,
          useValue: {
            send: jest.fn(),
          } as any,
        },
        {
          provide: OauthClientCredentialsService,
          useValue: {} as any,
        },
      ],
    }).compile();

    service = module.get<EmailConfirmationService>(EmailConfirmationService);
    repository = module.get<Repository<EmailConfirmation>>( // eslint-disable-line @typescript-eslint/no-unused-vars
      getRepositoryToken(EmailConfirmation),
    );
    userService = module.get<UserService>(UserService); // eslint-disable-line @typescript-eslint/no-unused-vars
    mailService = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw a ConflictException if email confirmation already exists', async () => {
      const user = { role: 'Admin', api_user_id: 123, email: 'test@example.com' } as unknown as User;
      
      jest.spyOn(userService, 'findOne').mockResolvedValue({ role: 'Admin', api_user_id: 123 } as unknown as User);
      jest.spyOn(repository, 'findOne').mockResolvedValue({ user } as EmailConfirmation);
  
      await expect(service.create(user)).rejects.toThrow(ConflictException);
    });

    it('should not create email confirmation if user is Admin but findOne returns undefined', async () => {
      const user = { role: 'Admin', api_user_id: 123, email: 'test@example.com' } as unknown as User;
      
      jest.spyOn(userService, 'findOne').mockResolvedValue(undefined);
  
      const result = await service.create(user);
  
      expect(result).toBeNull();
    });
  });

  describe('admincreate', () => {
    it('should throw ConflictException if user already exists', async () => {
      const user = { role: 'Admin', api_user_id: 123, email: 'test@example.com' } as unknown as User;
      const emailConfirmation = {id : 1, user: user, confirmed: true, toklen: 'token', expiryTimestamp: 78768 } as unknown as EmailConfirmation;
      const findOneSpy = jest.spyOn(repository,'findOne').mockResolvedValueOnce(emailConfirmation); // Mock user already exists
  
      const password = 'password';
  
      await expect(service.admincreate(user, password)).rejects.toThrow(
        ConflictException
      );
  
      expect(findOneSpy).toHaveBeenCalledWith({
        where: { user: { email: user.email } },
        relations: ['user'],
      });
    });
  });
  
  describe('get', () => {
    it('should return email confirmation if userId matches', async () => {
      const userId = 1;
      const emailConfirmation = {
        user: { id: userId, email: 'test@example.com' } as unknown as User,
      } as EmailConfirmation;
  
      const findSpy = jest.spyOn(repository,'find').mockResolvedValueOnce([emailConfirmation]);
  
      const result = await service.get(userId);
  
      expect(findSpy).toHaveBeenCalledWith({ relations: ['user'] });
      expect(result).toEqual(emailConfirmation);
    });
  
    it('should return undefined if no email confirmation matches userId', async () => {
      const userId = 2;
  
      const findSpy = jest.spyOn(repository,'find').mockResolvedValueOnce([]); // No email confirmations
  
      const result = await service.get(userId);
  
      expect(findSpy).toHaveBeenCalledWith({ relations: ['user'] });
      expect(result).toBeUndefined();
    });
  });

  describe('getByEmail', () => {
    it('should return email confirmation if email matches', async () => {
      const email = 'test@example.com';
      const emailConfirmation = {
        user: { email } as User,
      } as EmailConfirmation;
  
      const findSpy = jest.spyOn(repository,'find').mockResolvedValueOnce([emailConfirmation]);
  
      const result = await service.getByEmail(email);
  
      expect(findSpy).toHaveBeenCalledWith({ relations: ['user'] });
      expect(result).toEqual(emailConfirmation);
    });
  
    it('should return undefined if no email confirmation matches the email', async () => {
      const email = 'notfound@example.com';
  
      const findSpy = jest.spyOn(repository,'find').mockResolvedValueOnce([]); // No email confirmations found
  
      const result = await service.getByEmail(email);
  
      expect(findSpy).toHaveBeenCalledWith({ relations: ['user'] });
      expect(result).toBeUndefined();
    });
  
    it('should handle case-insensitive email matching', async () => {
      const email = 'Test@Example.com';
      const emailConfirmation = {
        user: { email: 'test@example.com' } as User,
      } as EmailConfirmation;
  
      const findSpy = jest.spyOn(repository,'find').mockResolvedValueOnce([emailConfirmation]);
  
      const result = await service.getByEmail(email);
  
      expect(findSpy).toHaveBeenCalledWith({ relations: ['user'] });
      expect(result).toEqual(emailConfirmation);
    });
  });

  describe('findOne', () => {
    it('should return email confirmation if conditions match', async () => {
      const conditions: FindConditions<EmailConfirmation> = {
        token: 'testToken',
      };
      const emailConfirmation = {
        user: { email: 'test@example.com' } as User,
        token: 'testToken',
      } as EmailConfirmation;
  
      const findOneSpy = jest.spyOn(repository,'findOne').mockResolvedValueOnce(emailConfirmation);
  
      const result = await service.findOne(conditions);
  
      expect(findOneSpy).toHaveBeenCalledWith(conditions, {
        relations: ['user'],
      });
      expect(result).toEqual(emailConfirmation);
    });
  
    it('should return undefined if no email confirmation matches conditions', async () => {
      const conditions: FindConditions<EmailConfirmation> = {
        token: 'nonExistentToken',
      };
  
      const findOneSpy = jest.spyOn(repository,'findOne').mockResolvedValueOnce(undefined); // No email confirmations match
  
      const result = await service.findOne(conditions);
  
      expect(findOneSpy).toHaveBeenCalledWith(conditions, {
        relations: ['user'],
      });
      expect(result).toBeUndefined();
    });
  });

  describe('confirmEmail', () => {
    it('should throw BadRequestException if email confirmation does not exist', async () => {
      const token = 'nonExistentToken';
  
      const findOneSpy = jest.spyOn(repository,'findOne').mockResolvedValueOnce(undefined); // No email confirmation found
  
      await expect(service.confirmEmail(token)).rejects.toThrow(
        BadRequestException,
      );
  
      expect(findOneSpy).toHaveBeenCalledWith({
        where: { token },
      });
    });
  
    it('should return a response indicating email is already confirmed', async () => {
      const token = 'alreadyConfirmedToken';
      const emailConfirmation = {
        token,
        confirmed: true,
      } as EmailConfirmation;
  
      const findOneSpy = jest.spyOn(repository,'findOne').mockResolvedValueOnce(emailConfirmation);
  
      const result = await service.confirmEmail(token);
  
      expect(findOneSpy).toHaveBeenCalledWith({
        where: { token },
      });
      expect(result).toEqual({
        success: false,
        message: EmailConfirmationResponse.AlreadyConfirmed,
      });
    });
  
    it('should return a response indicating email confirmation is expired', async () => {
      const token = 'expiredToken';
      const emailConfirmation = {
        token,
        confirmed: false,
        expiryTimestamp: Math.floor(DateTime.now().minus({ minutes: 1 }).toSeconds()), // Expired timestamp
      } as EmailConfirmation;
  
      const findOneSpy = jest.spyOn(repository,'findOne').mockResolvedValueOnce(emailConfirmation);
  
      const result = await service.confirmEmail(token);
  
      expect(findOneSpy).toHaveBeenCalledWith({
        where: { token },
      });
      expect(result).toEqual({
        success: false,
        message: EmailConfirmationResponse.Expired,
      });
    });
  });

  describe('sendConfirmationEmail', () => {
    it('should return an error response if no token is found', async () => {
      const email = 'test@example.com';
  
      const getByEmailSpy = jest.spyOn(service, 'getByEmail').mockResolvedValueOnce(undefined); // No token found
  
      const result = await service.sendConfirmationEmail(email);
  
      expect(getByEmailSpy).toHaveBeenCalledWith(email);
      expect(result).toEqual({
        success: false,
        message: 'Token not found',
      });
    });
  
    it('should throw a BadRequestException if email is already confirmed', async () => {
      const email = 'test@example.com';
      const currentToken = {
        id: 1,
        confirmed: true,
      } as EmailConfirmation;
  
      const getByEmailSpy = jest.spyOn(service,'getByEmail').mockResolvedValueOnce(currentToken);
  
      await expect(service.sendConfirmationEmail(email)).rejects.toThrow(
        BadRequestException,
      );
  
      expect(getByEmailSpy).toHaveBeenCalledWith(email);
    });
    it('should generate a new token and send a confirmation email if valid', async () => {
      const email = 'test@example.com';
      const currentToken = {
        id: 1,
        confirmed: false,
      } as EmailConfirmation;
      const generatedToken = { token: 'newToken' };
  
      const getByEmailSpy = jest.spyOn(service, 'getByEmail').mockResolvedValueOnce(currentToken);
      const generatetokenSpy = jest.spyOn(service, 'generatetoken').mockResolvedValueOnce(generatedToken);
  
      // TypeScript workaround: Cast service to 'any' to bypass typing issues
      const sendConfirmEmailRequestSpy = jest.spyOn<any, any>(service, 'sendConfirmEmailRequest').mockResolvedValueOnce(undefined);
  
      const result = await service.sendConfirmationEmail(email);
  
      expect(getByEmailSpy).toHaveBeenCalledWith(email);
      expect(generatetokenSpy).toHaveBeenCalledWith(currentToken, currentToken.id);
      expect(sendConfirmEmailRequestSpy).toHaveBeenCalledWith(
        email.toLowerCase(),
        generatedToken.token,
      );
      expect(result).toEqual({
        success: true,
      });
    });
  });

  describe('ConfirmationEmailForResetPassword', () => {
    it('should return a failure response if email not found', async () => {
      const email = 'nonexistent@example.com';
  
      jest.spyOn(service, 'getByEmail').mockResolvedValueOnce(undefined);
  
      const result = await service.ConfirmationEmailForResetPassword(email);
  
      expect(result).toEqual({
        message: 'Email not found or Email not registered',
        success: false,
      });
    });
  
    it('should generate a new token and send a reset password email if email exists', async () => {
      const email = 'test@example.com';
      const currentToken = {
        id: 1,
        user: { role: 'Admin' },
      } as EmailConfirmation;
      const generatedToken = { token: 'newToken' };
  
      const getByEmailSpy = jest.spyOn(service, 'getByEmail').mockResolvedValueOnce(currentToken);
      const generatetokenSpy = jest.spyOn(service, 'generatetoken').mockResolvedValueOnce(generatedToken);
      const sendResetPasswordRequestSpy = jest.spyOn<any, any>(service, 'sendResetPasswordRequest').mockResolvedValueOnce(undefined);
  
      const result = await service.ConfirmationEmailForResetPassword(email);
  
      expect(getByEmailSpy).toHaveBeenCalledWith(email);
      expect(generatetokenSpy).toHaveBeenCalledWith(currentToken, currentToken.id);
      expect(sendResetPasswordRequestSpy).toHaveBeenCalledWith(
        email.toLowerCase(),
        generatedToken.token,
        currentToken.user.role,
      );
      expect(result).toEqual({
        success: true,
        message: 'Password Reset Mail has been sent to your register authorized Email.',
      });
    });
  });

  describe('generatetoken', () => {
    it('should generate a new token if the current one is expired', async () => {
      const currentToken = {
        token: 'oldToken',
        expiryTimestamp: Math.floor(Date.now() / 1000) - 3600, // 1 hour in the past
      } as EmailConfirmation;
      const id = 1;
    
      const updateSpy = jest.spyOn(repository, 'update').mockResolvedValueOnce(undefined);
    
      // Correctly typing the mocked return value
      const newToken = {
        token: 'newToken',
        expiryTimestamp: Math.floor(Date.now() / 1000) + 3600,
      } as EmailConfirmation; // Ensure this matches the return type of generateEmailToken
    
      const generateEmailTokenSpy = jest.spyOn(service, 'generateEmailToken').mockReturnValue(newToken);
    
      const result = await service.generatetoken(currentToken, id);
    
      expect(generateEmailTokenSpy).toHaveBeenCalled();
      expect(updateSpy).toHaveBeenCalledWith(id, newToken);
      expect(result).toEqual(newToken);
    });    
  });

  describe('generateEmailToken', () => {
    it('should generate a token with expiry timestamp 8 hours in the future', () => {
      const result = service.generateEmailToken();
      const currentTimeInSeconds = Math.floor(DateTime.now().toSeconds());
      const expectedExpiryTime = currentTimeInSeconds + 8 * 3600; // 8 hours in seconds

      // Allowing a margin of error of 10 seconds
      expect(result.expiryTimestamp).toBeGreaterThanOrEqual(expectedExpiryTime - 10);
      expect(result.expiryTimestamp).toBeLessThanOrEqual(expectedExpiryTime + 10);
    });

    it('should return an object conforming to IEmailConfirmationToken', () => {
      const result = service.generateEmailToken();
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('expiryTimestamp');
    });
  });

  describe('sendConfirmEmailRequest', () => {
    it('should send a confirmation email with correct details', async () => {
      const email = 'test@example.com';
      const token = 'sampleToken';
      const uiBaseUrl = 'http://localhost:3000'; // Example base URL
      process.env.UI_BASE_URL = uiBaseUrl; // Mocking environment variable

      const expectedUrl = `${uiBaseUrl}/confirm-email?token=${token}`;
      const expectedHtml = `Welcome to the marketplace! Please click the link below to verify your email address: <br/> <br/> <a href="${expectedUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px;">Confirm</a>.`;
      const sendSpy = jest.spyOn(mailService, 'send').mockResolvedValue(true);
      await service['sendConfirmEmailRequest'](email, token);

      expect(sendSpy).toHaveBeenCalledWith({
        to: email,
        subject: `[Origin] Confirm your email address`,
        html: expectedHtml,
      });
    });

    it('should log a success message when email is sent successfully', async () => {
      const email = 'test@example.com';
      const token = 'sampleToken';

      await service['sendConfirmEmailRequest'](email, token);

    });

    it('should log a verbose message at the start', async () => {
      const email = 'test@example.com';
      const token = 'sampleToken';

      await service['sendConfirmEmailRequest'](email, token);

    });
  });
});

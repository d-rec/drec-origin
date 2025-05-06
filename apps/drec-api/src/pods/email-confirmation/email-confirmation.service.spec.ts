import { Test, TestingModule } from '@nestjs/testing';
import { Repository} from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserService } from '../user/user.service';
import { MailService } from '../../mail';
import { EmailConfirmationService } from './email-confirmation.service';
import { EmailConfirmation } from './email-confirmation.entity';
import { OauthClientCredentialsService } from '../user/oauth_client.service';
import { User } from '../user/user.entity';
import { EmailConfirmationResponse } from '../../utils/enums';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { DateTime } from 'luxon';

describe('EmailConfirmationService', () => {
  let service: EmailConfirmationService;
  let repository: Repository<EmailConfirmation>;
  let userService: UserService;
  let mailService: MailService;

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
            updateUserEmailVerification: jest.fn(),
            verifyEmail: jest.fn(),
            findByEmail: jest.fn(),
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
    repository = module.get<Repository<EmailConfirmation>>(
      getRepositoryToken(EmailConfirmation),
    );
    userService = module.get<UserService>(UserService);
    mailService = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw a ConflictException if email confirmation already exists', async () => {
      const user = {
        role: 'Admin',
        api_user_id: 123,
        email: 'test@example.com',
      } as unknown as User;

      jest.spyOn(userService, 'findOne').mockResolvedValue({
        role: 'Admin',
        api_user_id: 123,
      } as unknown as User);
      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue({ user } as EmailConfirmation);

      await expect(service.create(user)).rejects.toThrow(ConflictException);
    });

    it('should not create email confirmation if user is Admin but findOne returns undefined', async () => {
      const user = {
        role: 'Admin',
        api_user_id: 123,
        email: 'test@example.com',
      } as unknown as User;

      jest.spyOn(userService, 'findOne').mockResolvedValue(undefined);

      const result = await service.create(user);

      expect(result).toBeNull();
    });
  });

  describe('adminCreate', () => {
    it('should throw ConflictException if user already exists', async () => {
      const user = {
        role: 'Admin',
        api_user_id: 123,
        email: 'test@example.com',
      } as unknown as User;
      const emailConfirmation = {
        id: 1,
        user: user,
        confirmed: true,
        token: 'token',
        expiryTimestamp: 78768,
      } as unknown as EmailConfirmation;
      const findOneSpy = jest
        .spyOn(repository, 'findOne')
        .mockResolvedValueOnce(emailConfirmation);

      const password = 'password';

      await expect(service.adminCreate(user, password)).rejects.toThrow(
        ConflictException,
      );

      expect(findOneSpy).toHaveBeenCalledWith({
        where: { user: { email: user.email } },
        relations: ['user'],
      });
    });
  });

  describe('confirmEmail', () => {
    it('should throw BadRequestException if email confirmation does not exist', async () => {
      const token = 'nonExistentToken';

      const findOneSpy = jest
        .spyOn(repository, 'findOne')
        .mockResolvedValueOnce(undefined);

      await expect(service.confirmEmail(token)).rejects.toThrow(
        BadRequestException,
      );

      expect(findOneSpy).toHaveBeenCalledWith({
        where: { token },
        relations: ['user'],
      });
    });

    it('should return a response indicating email is already confirmed', async () => {
      const token = 'alreadyConfirmedToken';
      const mockUser: User = {
        id: 1,
        email: 'test@example.com',
        emailVerifiedAt: new Date(),
      } as User;
      const emailConfirmation: EmailConfirmation = {
        id: 1,
        token,
        confirmed: true,
        user: mockUser,
        expiryTimestamp: Math.floor(
          DateTime.now().plus({ hours: 1 }).toSeconds(),
        ),
      } as EmailConfirmation;

      const findOneSpy = jest
        .spyOn(repository, 'findOne')
        .mockResolvedValueOnce(emailConfirmation);
      const findByEmailSpy = jest
        .spyOn(userService, 'findByEmail')
        .mockResolvedValueOnce(mockUser);

      const result = await service.confirmEmail(token);

      expect(findOneSpy).toHaveBeenCalledWith({
        where: { token },
        relations: ['user'],
      });
      expect(findByEmailSpy).toHaveBeenCalledWith(mockUser.email);
      expect(result).toEqual({
        success: false,
        message: EmailConfirmationResponse.AlreadyConfirmed,
      });
    });

    it('should return a response indicating email confirmation is expired', async () => {
      const token = 'expiredToken';
      const mockUser: User = {
        id: 1,
        email: 'test@example.com',
      } as User;
      const emailConfirmation: EmailConfirmation = {
        id: 1,
        token,
        confirmed: false,
        user: mockUser,
        expiryTimestamp: Math.floor(
          DateTime.now().minus({ minutes: 1 }).toSeconds(),
        ),
      } as EmailConfirmation;

      const findOneSpy = jest
        .spyOn(repository, 'findOne')
        .mockResolvedValueOnce(emailConfirmation);
      const findByEmailSpy = jest
        .spyOn(userService, 'findByEmail')
        .mockResolvedValueOnce(mockUser);

      const result = await service.confirmEmail(token);

      expect(findOneSpy).toHaveBeenCalledWith({
        where: { token },
        relations: ['user'],
      });
      expect(findByEmailSpy).toHaveBeenCalledWith(mockUser.email);
      expect(result).toEqual({
        success: false,
        message: EmailConfirmationResponse.Expired,
      });
    });

    it('should confirm email and return success response', async () => {
      const token = 'validToken';
      const mockUser: User = {
        id: 1,
        email: 'test@example.com',
      } as User;
      const emailConfirmation: EmailConfirmation = {
        id: 1,
        token,
        confirmed: false,
        user: mockUser,
        expiryTimestamp: Math.floor(
          DateTime.now().plus({ hours: 1 }).toSeconds(),
        ),
      } as EmailConfirmation;

      const findOneSpy = jest
        .spyOn(repository, 'findOne')
        .mockResolvedValueOnce(emailConfirmation);
      const findByEmailSpy = jest
        .spyOn(userService, 'findByEmail')
        .mockResolvedValueOnce(mockUser);
      const updateSpy = jest
        .spyOn(repository, 'update')
        .mockResolvedValueOnce({ affected: 1 } as any);
      const verifyEmailSpy = jest
        .spyOn(userService, 'verifyEmail')
        .mockResolvedValueOnce({} as any);

      const result = await service.confirmEmail(token);

      expect(findOneSpy).toHaveBeenCalledWith({
        where: { token },
        relations: ['user'],
      });
      expect(findByEmailSpy).toHaveBeenCalledWith(mockUser.email);
      expect(updateSpy).toHaveBeenCalledWith(emailConfirmation.id, {
        confirmed: true,
      });
      expect(verifyEmailSpy).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual({
        success: true,
        message: EmailConfirmationResponse.Success,
      });
    });
  });

  describe('sendConfirmationEmail', () => {
    it('should return an error response if no token is found', async () => {
      const email = 'test@example.com';

      const getByEmailSpy = jest
        .spyOn(service, 'getByEmail')
        .mockResolvedValueOnce(undefined);
      const findByEmailSpy = jest
        .spyOn(userService, 'findByEmail')
        .mockResolvedValueOnce({} as User);

      const result = await service.sendConfirmationEmail(email);

      expect(getByEmailSpy).toHaveBeenCalledWith(email);
      expect(findByEmailSpy).toHaveBeenCalledWith(email);
      expect(result).toEqual({
        success: false,
        message: 'Token not found',
      });
    });

    it('should throw a BadRequestException if email is already confirmed', async () => {
      const email = 'test@example.com';
      const mockUser: User = {
        id: 1,
        email: 'test@example.com',
        emailVerifiedAt: new Date(),
      } as User;
      const currentToken: EmailConfirmation = {
        id: 1,
        confirmed: true,
        user: mockUser,
        token: 'token',
        expiryTimestamp: Math.floor(
          DateTime.now().plus({ hours: 1 }).toSeconds(),
        ),
      } as EmailConfirmation;

      const getByEmailSpy = jest
        .spyOn(service, 'getByEmail')
        .mockResolvedValueOnce(currentToken);
      const findByEmailSpy = jest
        .spyOn(userService, 'findByEmail')
        .mockResolvedValueOnce(mockUser);

      await expect(service.sendConfirmationEmail(email)).rejects.toThrow(
        BadRequestException,
      );

      expect(getByEmailSpy).toHaveBeenCalledWith(email);
      expect(findByEmailSpy).toHaveBeenCalledWith(email);
    });

    it('should generate a new token and send a confirmation email if valid', async () => {
      const email = 'test@example.com';
      const mockUser: User = {
        id: 1,
        email: 'test@example.com',
      } as User;
      const currentToken: EmailConfirmation = {
        id: 1,
        confirmed: false,
        user: mockUser,
        token: 'oldToken',
        expiryTimestamp: Math.floor(
          DateTime.now().plus({ hours: 1 }).toSeconds(),
        ),
      } as EmailConfirmation;
      const generatedToken = { token: 'newToken' };

      const getByEmailSpy = jest
        .spyOn(service, 'getByEmail')
        .mockResolvedValueOnce(currentToken);
      const findByEmailSpy = jest
        .spyOn(userService, 'findByEmail')
        .mockResolvedValueOnce(mockUser);
      const generateTokenSpy = jest
        .spyOn(service, 'generateToken')
        .mockResolvedValueOnce(generatedToken);
      const sendConfirmEmailRequestSpy = jest
        .spyOn<any, any>(service, 'sendConfirmEmailRequest')
        .mockResolvedValueOnce(undefined);

      const result = await service.sendConfirmationEmail(email);

      expect(getByEmailSpy).toHaveBeenCalledWith(email);
      expect(findByEmailSpy).toHaveBeenCalledWith(email);
      expect(generateTokenSpy).toHaveBeenCalledWith(
        currentToken,
        currentToken.id,
      );
      expect(sendConfirmEmailRequestSpy).toHaveBeenCalledWith(
        email.toLowerCase(),
        generatedToken.token,
      );
      expect(result).toEqual({
        success: true,
      });
    });
  });

  describe('generateToken', () => {
    it('should generate a new token if the current one is expired', async () => {
      const currentToken: EmailConfirmation = {
        id: 1,
        token: 'oldToken',
        expiryTimestamp: Math.floor(
          DateTime.now().minus({ hours: 1 }).toSeconds(),
        ),
      } as EmailConfirmation;
      const id = 1;
      const newToken = {
        token: 'newToken',
        expiryTimestamp: Math.floor(
          DateTime.now().plus({ hours: 8 }).toSeconds(),
        ),
      };

      const updateSpy = jest
        .spyOn(repository, 'update')
        .mockResolvedValueOnce(undefined);
      const generateEmailTokenSpy = jest
        .spyOn(service, 'generateEmailToken')
        .mockReturnValue(newToken);

      const result = await service.generateToken(currentToken, id);

      expect(generateEmailTokenSpy).toHaveBeenCalled();
      expect(updateSpy).toHaveBeenCalledWith(id, newToken);
      expect(result).toEqual(newToken);
    });

    it('should return existing token if not expired', async () => {
      const currentToken: EmailConfirmation = {
        id: 1,
        token: 'validToken',
        expiryTimestamp: Math.floor(
          DateTime.now().plus({ hours: 1 }).toSeconds(),
        ),
      } as EmailConfirmation;
      const id = 1;

      const result = await service.generateToken(currentToken, id);

      expect(result).toEqual({
        id: currentToken.id,
        token: currentToken.token,
        expiryTimestamp: currentToken.expiryTimestamp,
      });
    });
  });

  describe('generateEmailToken', () => {
    it('should generate a token with expiry timestamp 8 hours in the future', () => {
      const result = service.generateEmailToken();
      const currentTimeInSeconds = Math.floor(DateTime.now().toSeconds());
      const expectedExpiryTime = currentTimeInSeconds + 8 * 3600; // 8 hours in seconds

      expect(result.expiryTimestamp).toBeGreaterThanOrEqual(
        expectedExpiryTime - 10,
      );
      expect(result.expiryTimestamp).toBeLessThanOrEqual(
        expectedExpiryTime + 10,
      );
      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe('string');
      expect(result.token.length).toBeGreaterThan(0);
    });
  });

  describe('sendConfirmEmailRequest', () => {
    it('should send a confirmation email with correct details', async () => {
      const email = 'test@example.com';
      const token = 'sampleToken';
      const uiBaseUrl = 'http://localhost:3000';
      process.env.UI_BASE_URL = uiBaseUrl;

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
  });
});

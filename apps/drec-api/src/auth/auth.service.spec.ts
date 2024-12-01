/* eslint-disable @typescript-eslint/no-unused-vars */

import { Test, TestingModule } from '@nestjs/testing';
import { AuthService, IJWTPayload } from './auth.service';
import { UserService } from '../pods/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { OauthClientCredentialsService } from '../pods/user/oauth_client.service';
import bcrypt from 'bcryptjs';
import { UserDTO } from '../pods/user/dto/user.dto';
import { OrganizationStatus, Role, UserStatus } from '../utils/enums';
import { IUser } from 'src/models/User';
import { LoginReturnDataDTO } from './dto/login-return-data.dto';

describe('AuthService', () => {
  let service: AuthService;
  let userService: UserService;
  let jwtService: JwtService;
  let oauthClientService: OauthClientCredentialsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            getUserAndPasswordByEmail: jest.fn(), // Mock method
            findById: jest.fn(), // Include other methods if needed
            createUserSession: jest.fn(),
            removeUsersession: jest.fn(),
            hasgetUserTokenvalid: jest.fn(),
          } as any,
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          } as any,
        },
        {
          provide: OauthClientCredentialsService,
          useValue: {} as any,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
    oauthClientService = module.get<OauthClientCredentialsService>(
      OauthClientCredentialsService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user DTO when valid credentials are provided', async () => {
      const user = {
        email: 'test@example.com',
        password: bcrypt.hashSync('password', 10),
      };

      const userWithPassword = {
        id: 1,
        email: 'test@example.com',
        password: user.password, // Include password here
      };

      jest
        .spyOn(userService, 'getUserAndPasswordByEmail')
        .mockResolvedValue(userWithPassword);

      const result = await service.validateUser(
        'aishuutech@gmail.com',
        'Drec@1234',
      );
      expect(result).toBeDefined();
    });

    it('should return null when invalid credentials are provided', async () => {
      jest
        .spyOn(userService, 'getUserAndPasswordByEmail')
        .mockResolvedValue(null);

      const result = await service.validateUser('test@example.com', 'password');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    const userDto: UserDTO = {
      id: 1,
      firstName: 'fName',
      lastName: 'lName',
      email: 'test@example.com',
      notifications: true,
      status: UserStatus.Active,
      role: Role.OrganizationAdmin,
      organization: {
        id: 1,
        name: 'org1',
        address: 'sAddress',
        zipCode: '623754',
        city: 'Chennai',
        country: 'India',
        organizationType: 'Developer',
        status: OrganizationStatus.Active,
      },
    };
    it('should get result', async () => {
      //const user = { email: 'test@example.com', id: '123', role: 'user' };
      const token = 'fake-jwt-token';
      jest.spyOn(jwtService, 'sign').mockReturnValue(token);

      const response = await service.login(userDto);

      expect(response).toBeDefined();
    });

    it('should return an access token', async () => {
      const user = { email: 'test@example.com', id: '123', role: 'user' };
      const token = 'fake-jwt-token';
      jest.spyOn(jwtService, 'sign').mockReturnValue(token);

      const result = await service.login(userDto);

      expect(result).toEqual({ accessToken: token });
    });

    it('should create a user session', async () => {
      const user = { email: 'test@example.com', id: '123', role: 'user' };
      const token = 'fake-jwt-token';
      jest.spyOn(jwtService, 'sign').mockReturnValue(token);

      await service.login(userDto);

      expect(userService.createUserSession).toHaveBeenCalledWith(
        userDto,
        token,
      );
    });
  });

  describe('logout', () => {
    it('should call removeUsersession with correct parameters', async () => {
      const payload: IJWTPayload = {
        id: 1,
        email: 'test@example.com',
        role: Role.OrganizationAdmin,
      };
      const token = 'fake-jwt-token';

      const deleteResult = { affected: 1, raw: [] };
      jest
        .spyOn(userService, 'removeUsersession')
        .mockResolvedValue(deleteResult);

      await service.logout(payload, token);

      expect(userService.removeUsersession).toHaveBeenCalledWith(
        payload.id,
        token,
      );
    });

    it('should return DeleteResult on successful logout', async () => {
      const payload: IJWTPayload = {
        id: 1,
        email: 'test@example.com',
        role: Role.ApiUser,
      };
      const token = 'fake-jwt-token';

      const deleteResult = { affected: 1, raw: [] };
      jest
        .spyOn(userService, 'removeUsersession')
        .mockResolvedValue(deleteResult);

      const result = await service.logout(payload, token);

      expect(result).toBe(deleteResult);
    });

    it('should handle errors thrown by removeUsersession', async () => {
      const payload: IJWTPayload = {
        id: 1,
        email: 'test@example.com',
        role: Role.Buyer,
      };
      const token = 'fake-jwt-token';

      const error = new Error('Unable to remove user session');
      jest.spyOn(userService, 'removeUsersession').mockRejectedValue(error);

      await expect(service.logout(payload, token)).rejects.toThrow(
        'Unable to remove user session',
      );
    });

    it('should handle case where no session is found', async () => {
      const payload: IJWTPayload = {
        id: 1,
        email: 'test@example.com',
        role: Role.SubBuyer,
      };
      const token = 'fake-jwt-token';

      const deleteResult = { affected: 0, raw: [] };
      jest
        .spyOn(userService, 'removeUsersession')
        .mockResolvedValue(deleteResult);

      const result = await service.logout(payload, token);

      expect(result).toBe(deleteResult);
      expect(result.affected).toBe(0);
    });
  });

  describe('isTokenBlacklisted', () => {
    it('should call hasgetUserTokenvalid with correct parameters', async () => {
      const token = 'fake-jwt-token';
      const payload: IJWTPayload = {
        id: 1,
        email: 'test@example.com',
        role: Role.ApiUser,
      };

      const tokeninvalidate = true;
      jest
        .spyOn(userService, 'hasgetUserTokenvalid')
        .mockResolvedValue(tokeninvalidate);

      await service.isTokenBlacklisted(token, payload);

      expect(userService.hasgetUserTokenvalid).toHaveBeenCalledWith({
        accesstoken_hash: token,
        userId: payload.id,
      });
    });

    it('should return true if token is blacklisted', async () => {
      const token = 'fake-jwt-token';
      const payload: IJWTPayload = {
        id: 1,
        email: 'test@example.com',
        role: Role.Buyer,
      };

      jest.spyOn(userService, 'hasgetUserTokenvalid').mockResolvedValue(true);

      const result = await service.isTokenBlacklisted(token, payload);

      expect(result).toBe(true);
    });

    it('should return false if token is not blacklisted', async () => {
      const token = 'fake-jwt-token';
      const payload: IJWTPayload = {
        id: 1,
        email: 'test@example.com',
        role: Role.OrganizationAdmin,
      };

      jest.spyOn(userService, 'hasgetUserTokenvalid').mockResolvedValue(false);

      const result = await service.isTokenBlacklisted(token, payload);

      expect(result).toBe(false);
    });

    it('should handle errors thrown by hasgetUserTokenvalid', async () => {
      const token = 'fake-jwt-token';
      const payload: IJWTPayload = {
        id: 1,
        email: 'test@example.com',
        role: Role.SubBuyer,
      };

      const error = new Error('Error checking token validity');
      jest.spyOn(userService, 'hasgetUserTokenvalid').mockRejectedValue(error);

      await expect(service.isTokenBlacklisted(token, payload)).rejects.toThrow(
        'Error checking token validity',
      );
    });
  });

  describe('generateToken', () => {
    it('should call jwtService.sign with correct payload and options', async () => {
      const user: Omit<IUser, 'password'> = {
        id: 1,
        firstName: 'fName',
        lastName: 'lName',
        email: 'test@example.com',
        notifications: true,
        status: UserStatus.Active,
        role: Role.OrganizationAdmin,
        organization: {
          id: 1,
          name: 'org1',
          address: 'sAddress',
          zipCode: '623754',
          city: 'Chennai',
          country: 'India',
          organizationType: 'Developer',
          status: OrganizationStatus.Active,
        },
      };
      const fileData = 'file-data';

      const token = 'fake-jwt-token';
      jest.spyOn(jwtService, 'sign').mockReturnValue(token);

      const payload: IJWTPayload = {
        email: user.email.toLowerCase(),
        id: user.id,
        role: user.role,
      };

      await service.generateToken(user, fileData);

      expect(jwtService.sign).toHaveBeenCalledWith(payload, {
        privateKey: fileData,
        secret: 'my-secret',
      });
    });

    it('should return an object with the accessToken', async () => {
      const user: Omit<IUser, 'password'> = {
        id: 1,
        firstName: 'fName',
        lastName: 'lName',
        email: 'test@example.com',
        notifications: true,
        status: UserStatus.Active,
        role: Role.OrganizationAdmin,
        organization: {
          id: 1,
          name: 'org1',
          address: 'sAddress',
          zipCode: '623754',
          city: 'Chennai',
          country: 'India',
          organizationType: 'Developer',
          status: OrganizationStatus.Active,
        },
      };
      const fileData = 'file-data';

      const token = 'fake-jwt-token';
      jest.spyOn(jwtService, 'sign').mockReturnValue(token);

      const result: LoginReturnDataDTO = await service.generateToken(
        user,
        fileData,
      );

      expect(result).toEqual({
        accessToken: token,
      });
    });

    it('should handle errors thrown by jwtService.sign', async () => {
      const user: Omit<IUser, 'password'> = {
        id: 1,
        firstName: 'fName',
        lastName: 'lName',
        email: 'test@example.com',
        notifications: true,
        status: UserStatus.Active,
        role: Role.OrganizationAdmin,
        organization: {
          id: 1,
          name: 'org1',
          address: 'sAddress',
          zipCode: '623754',
          city: 'Chennai',
          country: 'India',
          organizationType: 'Developer',
          status: OrganizationStatus.Active,
        },
      };
      const fileData = 'file-data';

      const error = new Error('Error signing token');
      jest.spyOn(jwtService, 'sign').mockImplementation(() => {
        throw error;
      });

      await expect(service.generateToken(user, fileData)).rejects.toThrow(
        'Error signing token',
      );
    });
  });
});

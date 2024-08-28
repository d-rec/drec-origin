import { Test, TestingModule } from '@nestjs/testing';
import { ClientJwtStrategy } from './client-jwt.strategy';
import { JwtService } from '@nestjs/jwt';
import { OauthClientCredentialsService } from '../pods/user/oauth_client.service';
import { UserService } from '../pods/user/user.service';
import { IJWTPayload } from './auth.service';
import { IUser } from 'src/models';
import { Request } from 'express';
import { OrganizationStatus, Role, UserStatus } from '../utils/enums';

describe('ClientJwtStrategy', () => {
  let strategy: ClientJwtStrategy;
  let jwtService: JwtService;
  let oauthClientService: OauthClientCredentialsService;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientJwtStrategy,
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
          },
        },
        {
          provide: OauthClientCredentialsService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: UserService,
          useValue: {
            findByEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    strategy = module.get<ClientJwtStrategy>(ClientJwtStrategy);
    jwtService = module.get<JwtService>(JwtService);
    oauthClientService = module.get(OauthClientCredentialsService);
    userService = module.get(UserService);
  });

  describe('validate', () => {
    it('should return user if token is valid and user is found', async () => {
      const payload: IJWTPayload = { id: 1, email: 'test@example.com', role: 'user' as Role };
      const token = 'mockToken';
      const email = 'test@example.com';
      const user: IUser = {
        id: 1,
        firstName: 'test',
        lastName: 'test',
        notifications: true,
        status: UserStatus.Active,
        email,
        role: Role.User,
        organization: {
          id: 1,
          name: 'Admin_DREC',
          address: 'Bangalore',
          zipCode: null,
          city: null,
          country: null,
          blockchainAccountAddress: null,
          blockchainAccountSignedMessage: null,
          organizationType: 'ApiUser',
          status: OrganizationStatus.Active,
          documentIds: null,
        },
      };

      const request = { headers: { authorization: `Bearer ${token}` } } as unknown as Request;

      const findByEmailSpy = jest.spyOn(userService, 'findByEmail').mockResolvedValue(user);
      const getSpy = jest.spyOn(oauthClientService, 'get').mockResolvedValue({ client_id: 'publicKey' });
      const verifySpy = jest.spyOn(jwtService, 'verify').mockResolvedValue(payload as unknown as IJWTPayload);

      const result = await strategy.validate(request, payload);

      expect(result).toEqual(user);
      expect(findByEmailSpy).toHaveBeenCalledWith(payload.email);
      expect(getSpy).toHaveBeenCalled();
      expect(verifySpy).toHaveBeenCalledWith(token, {
        publicKey: 'publicKey',
        secret: 'my-secret',
      });
    });      
/*
    it('should throw an error if user is not found', async () => {
      const payload: IJWTPayload = { id: 1, email: 'test@example.com', role: 'user' as Role };
      const token = 'mockToken';
      const request = { headers: { authorization: `Bearer ${token}` } } as Request;

      jest.spyOn(userService, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(oauthClientService, 'get').mockResolvedValue({ client_id: 'publicKey' });

      await expect(strategy.validate(request, payload)).rejects.toThrow();
      expect(userService.findByEmail).toHaveBeenCalledWith(payload.email);
    });

    it('should throw an error if JWT verification fails', async () => {
      const payload: IJWTPayload = { id: 1, email: 'test@example.com', role: 'user' as Role };
      const token = 'mockToken';
      const user: IUser = { id: 1, email: 'test@example.com', role: 'user' as Role, api_user_id: 'client_id' };

      const request = { headers: { authorization: `Bearer ${token}` } } as Request;

      jest.spyOn(userService, 'findByEmail').mockResolvedValue(user);
      jest.spyOn(oauthClientService, 'get').mockResolvedValue({ client_id: 'publicKey' });
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(strategy.validate(request, payload)).rejects.toThrow('Invalid token');
      expect(userService.findByEmail).toHaveBeenCalledWith(payload.email);
      expect(oauthClientService.get).toHaveBeenCalledWith(user.api_user_id);
      expect(jwtService.verify).toHaveBeenCalledWith(token, {
        publicKey: 'publicKey',
        secret: 'my-secret',
      });
    });*/
  });
});

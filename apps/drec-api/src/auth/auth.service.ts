import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { UserLoginReturnData } from '@energyweb/origin-backend-core';
import { IUser } from '../models';

import { UserService } from '../pods/user/user.service';
import { UserDTO } from '../pods/user/dto/user.dto';
import { Role } from '../utils/enums/role.enum';
import { OauthClientCredentialsService } from '../pods/user/oauth_client.service';
import { DeleteResult } from 'typeorm';
import { LoginReturnDataDTO } from './dto/login-return-data.dto';
import { ConfigService } from '@nestjs/config';

export interface IJWTPayload {
  id: number;
  email: string;
  role: Role;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly blacklist: Set<string> = new Set();
  constructor(
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly oauthClientService: OauthClientCredentialsService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(
    email: string,
    unencryptedPassword: string,
  ): Promise<UserDTO | null> {
    this.logger.verbose('With in validateUser');
    const user = await this.userService.getUserAndPasswordByEmail(
      email.toLowerCase(),
    );
    if (user && bcrypt.compareSync(unencryptedPassword, user.password)) {
      return this.userService.findById(user.id);
    }
    return null;
  }

  async login(user: Omit<IUser, 'password'>): Promise<UserLoginReturnData> {
    this.logger.verbose('With in login');
    const payload: IJWTPayload = {
      email: user.email.toLowerCase(),
      id: user.id,
      role: user.role,
    };
    const token = this.jwtService.sign(payload);
    await this.userService.createUserSession(user, token);
    return {
      accessToken: token,
    };
  }

  async logout(payload: IJWTPayload, token: string): Promise<DeleteResult> {
    return await this.userService.removeUserSession(payload.id, token);
  }

  async isTokenBlacklisted(
    token: string,
    payload: IJWTPayload,
  ): Promise<boolean> {
    const session = await this.userService.hasValidUserSession({
      accesstoken_hash: token,
      userId: payload.id,
    });
    return !session;
  }

  async generateToken(
    user: Omit<IUser, 'password'>,
    fileData: string,
  ): Promise<LoginReturnDataDTO> {
    //: Promise<UserLoginReturnData> {
    this.logger.verbose('With in generateToken');
    const payload: IJWTPayload = {
      email: user.email.toLowerCase(),
      id: user.id,
      role: user.role,
    };

    const token = this.jwtService.sign(payload, {
      privateKey: fileData,
      secret:
        this.configService.get<string>('JWT_API_USER_SECRET') || 'my-secret',
    });
    return {
      accessToken: token,
    };
  }
}

import { Injectable, Logger, } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { UserLoginReturnData } from '@energyweb/origin-backend-core';
import { IUser } from '../models';

import { UserService } from '../pods/user/user.service';
import { UserDTO } from '../pods/user/dto/user.dto';
import { Role } from '../utils/enums/role.enum';

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
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) { }

  async validateUser(
    email: string,
    unencryptedPassword: string,
  ): Promise<UserDTO | null> {
    this.logger.verbose("With in validateUser")
    const user = await this.userService.getUserAndPasswordByEmail(
      email.toLowerCase(),
    );
    if (user && bcrypt.compareSync(unencryptedPassword, user.password)) {
      return this.userService.findById(user.id);
    }
    return null;
  }

  async login(user: Omit<IUser, 'password'>): Promise<UserLoginReturnData> {
    this.logger.verbose("With in login")
    const payload: IJWTPayload = {
      email: user.email.toLowerCase(),
      id: user.id,
      role: user.role
    };
    const token = this.jwtService.sign(payload)
    this.userService.createUserSession(user, token)
    return {
      accessToken: token,
    };
  }
  async logout(payload: IJWTPayload){
    return await this.userService.removeUsersession(payload.id)
   
  }

  async isTokenBlacklisted(token: string, payload: IJWTPayload):Promise<boolean> {
    //hasUser({ email })
    const tokeninvalidate = await this.userService.hasgetUserTokenvalid({ accesstoken_hash:token, userId: payload.id })
    return tokeninvalidate;
  }
}

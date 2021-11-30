import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { IUser, UserLoginReturnData } from '@energyweb/origin-backend-core';

import { UserService } from '../pods/user/user.service';
import { UserDTO } from '../pods/user/dto/user.dto';

export interface IJWTPayload {
  id: number;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(
    email: string,
    unencryptedPassword: string,
  ): Promise<UserDTO | null> {
    const user = await this.userService.getUserAndPasswordByEmail(
      email.toLowerCase(),
    );

    if (user && bcrypt.compareSync(unencryptedPassword, user.password)) {
      return this.userService.findById(user.id);
    }

    return null;
  }

  async login(user: Omit<IUser, 'password'>): Promise<UserLoginReturnData> {
    const payload: IJWTPayload = {
      email: user.email.toLowerCase(),
      id: user.id,
    };

    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}

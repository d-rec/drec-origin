import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { UserService } from '../pods/user/user.service';
import { IJWTPayload } from './auth.service';
import { IUser } from '../models';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly userService: UserService,
    @Inject(ConfigService) configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'thisisnotsecret',
      passReqToCallback: true 
    });
  }

  async validate(request: Request,payload: IJWTPayload): Promise<IUser | null> {
   
    const user = await this.userService.findByEmail(payload.email);
    if (user) {
      return user;
    }
    return null;
  }
}

import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { UserService } from '../pods/user/user.service';
import { IJWTPayload } from './auth.service';
import { IUser } from '../models';
import { PermissionService } from '../pods/permission/permission.service'
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly userService: UserService,
    private readonly userPermission: PermissionService,
    @Inject(ConfigService) configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'thisisnotsecret',
    });
  }

  async validate(payload: IJWTPayload): Promise<IUser | null> {
    const user = await this.userService.findByEmail(payload.email);
    console.log(user);
    //const userpermission = await this.userPermission.findById(user?.id);
    //


    if (user) {
     
      return user;
    }

    return null;
  }
}

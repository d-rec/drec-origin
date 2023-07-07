import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
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
    // Extract the client ID and client secret from the request
    // const clientId = request.headers['client-id'];
    // const clientSecret = request.headers['client-secret'];
    // // If client ID and client secret are present in the request, validate them
    // if (clientId && clientSecret) {
    //   return await this.validateClient(clientId, clientSecret);
    // }
    const user = await this.userService.findByEmail(payload.email);
    //const userpermission = await this.userPermission.findById(user?.id);
    //
    if (user) {
      return user;
    }
    return null;
  }
  // async validateClient(clientId: string, clientSecret: string): Promise<any> {
  //   // Implement your client ID and client secret validation logic here
  //   // Example: Fetch client information from the database and check if the provided client ID and client secret match
  //   const client = await this.clientService.findByClientId(clientId);
  //   if (!client || client.clientSecret !== clientSecret) {
  //     throw new UnauthorizedException('Invalid client credentials');
  //   }
  //   return client;
  // }
}

import { Strategy, ExtractJwt } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OauthClientCredentialsService } from '../pods/user/oauth_client.service';
import { IJWTPayload } from './auth.service';
import { UserService } from '../pods/user/user.service';
import { IUser } from 'src/models';

@Injectable()
export class ClientJwtStrategy extends PassportStrategy(
  Strategy,
  'oauth2-client-password',
) {
  constructor(
    private readonly jwtService: JwtService,
    private readonly oauthClientService: OauthClientCredentialsService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'my-secret',
      passReqToCallback: true,
    });
  }

  async validate(request: Request, payload: IJWTPayload): Promise<IUser> {
    const token = (
      request.headers as { authorization?: string }
    ).authorization?.split(' ')[1];
    const user = await this.userService.findByEmail(payload.email);
    const publicKey = this.oauthClientService.get(user.api_user_id);
    await this.jwtService.verify(token, {
      publicKey: (await publicKey).client_id,
      secret: 'my-secret',
    });
    return user;
  }
}

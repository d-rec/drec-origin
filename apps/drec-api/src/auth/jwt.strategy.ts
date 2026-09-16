import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import {
  Injectable,
  Inject,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../pods/user/user.service';
import { IJWTPayload, AuthService } from './auth.service';
import { IUser } from '../models';
import { requireSecret } from './security.util';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    @Inject(ConfigService) configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: requireSecret(configService, 'JWT_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(
    request: Request,
    payload: IJWTPayload,
  ): Promise<IUser | null> {
    this.logger.verbose('With in validate');
    const token = (
      request.headers as { authorization?: string }
    ).authorization?.split(' ')[1];
    const invalidToken = await this.authService.isTokenBlacklisted(
      token,
      payload,
    );
    if (token && invalidToken) {
      throw new UnauthorizedException('Token revoked. Please log in again.');
    }

    const user = await this.userService.findByEmail(payload.email);

    return user || null;
  }
}

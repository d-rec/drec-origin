import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  Optional,
  Type,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard, AuthModuleOptions, IAuthGuard } from '@nestjs/passport';
import { memoize } from 'lodash';
import 'reflect-metadata';
import { IUser } from 'src/models/User';
import { ActiveUserGuard } from './ActiveUserGuard';
import { Reflector } from '@nestjs/core';

const isVerified = (context: ExecutionContext, logger: Logger): boolean => {
  logger.verbose('Checking if user is verified');

  const request = context.switchToHttp().getRequest();
  const user = request.user as IUser;

  if (!user) {
    logger.verbose('No user found in request, skipping verification check');
    return true;
  }

  if (!user.emailVerifiedAt) {
    throw new UnauthorizedException('Please verify your email address');
  }

  return true;
};

function createAuthVerifiedGuard(type?: string | string[]): Type<IAuthGuard> {
  @Injectable()
  class AuthVerifiedGuard extends AuthGuard(type) implements CanActivate {
    private logger = new Logger(AuthVerifiedGuard.name);

    constructor(@Optional() options?: AuthModuleOptions, private reflector: Reflector) {
      super(options);
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const isAuthenticated = await super.canActivate(context);

      if (!isAuthenticated) return false;

      const isActive = this.reflector.get<boolean>(
        ActiveUserGuard,
        context.getHandler(),
      );

      if (!isActive) return false;

      return isVerified(context, this.logger);
    }
  }

  return AuthVerifiedGuard;
}

export const AuthVerifiedGuard = memoize(createAuthVerifiedGuard);

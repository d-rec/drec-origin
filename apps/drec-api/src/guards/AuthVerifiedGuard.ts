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
import { IUser } from '../models/User';
import { ActiveUserGuard } from './ActiveUserGuard';
import { Reflector } from '@nestjs/core';

const SKIP_VERIFICATION_MODES = ['dev', 'stage', 'test'];

const isVerified = (context: ExecutionContext, logger: Logger): boolean => {
  const mode = process.env.MODE || '';
  if (SKIP_VERIFICATION_MODES.includes(mode)) {
    logger.verbose(`Skipping verification checks (MODE=${mode})`);
    return true;
  }

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

  if (!user.termsAcceptedAt) {
    throw new UnauthorizedException('Please accept the terms and conditions');
  }

  if (!user.phoneNumberVerifiedAt) {
    throw new UnauthorizedException('Please verify your phone number');
  }

  if (!user.organization.verifiedAt) {
    throw new UnauthorizedException('Please verify your organization');
  }

  return true;
};

function createAuthVerifiedGuard(type?: string | string[]): Type<IAuthGuard> {
  @Injectable()
  class AuthVerifiedGuard extends AuthGuard(type) implements CanActivate {
    private logger = new Logger(AuthVerifiedGuard.name);

    constructor(
      private reflector: Reflector,
      @Optional() options?: AuthModuleOptions,
    ) {
      super(options);
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const isAuthenticated = await super.canActivate(context);

      if (!isAuthenticated) return false;

      const activeUserGuard = new ActiveUserGuard(this.reflector);
      const isActive = await activeUserGuard.canActivate(context);

      if (!isActive) return false;

      return isVerified(context, this.logger);
    }
  }

  return AuthVerifiedGuard;
}

export const AuthVerifiedGuard = memoize(createAuthVerifiedGuard);

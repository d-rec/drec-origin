import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IUser } from '../models';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import 'reflect-metadata';

@Injectable()
export class VerifiedUserGuard implements CanActivate {
  private readonly logger = new Logger(VerifiedUserGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    this.logger.verbose('Checking if user is verified');

    const handler = context.getHandler();

    let isPublic = false;

    try {
      isPublic = Reflect.getMetadata(IS_PUBLIC_KEY, handler) === true;

      this.logger.debug(`Route public status: ${isPublic}`);
    } catch (error) {
      this.logger.error(`Error checking public metadata: ${error.message}`);
    }

    if (isPublic) {
      this.logger.verbose('Route is public, skipping verification check');
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as IUser;

    if (!user) {
      this.logger.verbose(
        'No user found in request, skipping verification check',
      );
      return true;
    }

    if (!user.emailVerifiedAt) {
      this.logger.warn(
        `User ${user.email} attempted to access protected route without email verification`,
      );
      throw new UnauthorizedException('Please verify your email address');
    }

    this.logger.verbose(`User ${user.email} verified, allowing access`);
    return true;
  }
}

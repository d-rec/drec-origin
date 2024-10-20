import { IUser, UserStatus } from '@energyweb/origin-backend-core';
import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class ActiveUserGuard implements CanActivate {
  private readonly logger = new Logger(ActiveUserGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    this.logger.verbose(`With in canActivate`);
    const request = context.switchToHttp().getRequest();
    const user = request.user as IUser;
    const _user = user as IUser;

    if (_user.status === UserStatus.Deleted) {
      this.logger.error(
        `Only not deleted users can perform this action. Your status is ${user.status}`,
      );
      throw new HttpException(
        `Only not deleted users can perform this action. Your status is ${user.status}`,
        HttpStatus.FORBIDDEN,
      );
    }

    if (_user.status !== UserStatus.Active) {
      this.logger.error(
        `Only active users can perform this action. Your status is ${_user.status}`,
      );
      throw new HttpException(
        `Only active users can perform this action. Your status is ${_user.status}`,
        HttpStatus.PRECONDITION_FAILED,
      );
    }

    return true;
  }
}

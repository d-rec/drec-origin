import { IUser, UserStatus } from '@energyweb/origin-backend-core';
import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class ActiveUserGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as IUser;
    const _user = user as IUser;

    if (_user.status === UserStatus.Deleted) {
      throw new HttpException(
        `Only not deleted users can perform this action. Your status is ${user.status}`,
        HttpStatus.FORBIDDEN,
      );
    }

    if (_user.status !== UserStatus.Active) {
      throw new HttpException(
        `Only active users can perform this action. Your status is ${_user.status}`,
        HttpStatus.PRECONDITION_FAILED,
      );
    }

    return true;
  }
}

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
} from '@nestjs/common';
import { UserStatus } from '@energyweb/origin-backend-core';

@Injectable()
export class NotDeletedUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();

    if (user.status === UserStatus.Deleted) {
      throw new HttpException(
        `Only not deleted users can perform this action. Your status is ${user.status}`,
        403,
      );
    }

    return true;
  }
}

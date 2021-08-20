import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IUser, LoggedInUser } from '../models';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!roles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as IUser;
    const loggedInUser = new LoggedInUser(user);

    const hasRole = () => roles.includes(loggedInUser.role);
    return user && loggedInUser && hasRole();
  }
}

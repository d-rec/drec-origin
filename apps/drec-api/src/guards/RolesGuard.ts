import { Injectable, CanActivate, ExecutionContext, Logger, } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IUser, LoggedInUser } from '../models';

@Injectable()
export class RolesGuard implements CanActivate {
  
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    this.logger.verbose( `With in canActivate`);
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

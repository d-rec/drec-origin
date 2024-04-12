//import { IUser, UserStatus } from '@energyweb/origin-backend-core';//
import { IUser, LoggedInUser } from '../models';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Inject,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
// import { AccessControl } from 'role-acl';

import { PermissionService } from '../pods/permission/permission.service';
import { OauthClientCredentials } from '../pods/user/oauth_client_credentials.entity';
import { UserService } from '../pods/user/user.service';
import { Role } from '../utils/enums';
@Injectable()
export class PermissionGuard implements CanActivate {
  private readonly logger = new Logger(PermissionGuard.name);

  constructor(
    private reflector: Reflector,
    @Inject(PermissionService)
    private readonly userPermission: PermissionService,
    @Inject(UserService)
    private readonly userService: UserService,
  ) {}
  //constructor(@Inject(KeyService) private keyService: KeyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.logger.verbose(`With in canActivate`);
    const permission = this.reflector.get<string[]>(
      'permission',
      context.getHandler(),
    );
    const module = this.reflector.get<string[]>(
      'acl_module',
      context.getHandler(),
    );
    if (!permission || !module) {
      return false;
    }
    const request = context.switchToHttp().getRequest();
    let user: IUser;
    user = request.user;
    if (request.url.split('/')[3] === 'register') {
      this.logger.verbose(`When ${request.url.split('/')[3]}`);
      if (request.body.organizationType === Role.ApiUser) {
        return true;
      }
    } else {
      user = request.user;
    }

    if (user.role === 'Admin') {
      return true;
    }
    if (
      (request.url.split('/')[3] === 'confirm-email' ||
        request.url.split('/')[3] === 'reset') &&
      user.role === Role.ApiUser
    ) {
      return true;
    }
    const per: any = [];

    const userpermission1 = await this.userPermission.findById(
      user.roleId,
      user.id,
      module,
    );

    userpermission1.forEach((e) => {
      e.permissions.forEach((element) => {
        if (!per.includes(element)) {
          per.push(element);
        }
      });
    });
    if (!userpermission1) {
      return false;
    }
    user.permissions = per;
    const loggedInUser = new LoggedInUser(user);

    const hasPermission = () =>
      loggedInUser.permissions.includes(permission[0]);

    return hasPermission();
  }
}

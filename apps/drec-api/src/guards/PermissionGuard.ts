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
import { UserService } from '../pods/user/user.service';
import { Role, OrganizationType } from '../utils/enums';
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
    const module: string[] = this.reflector.get<string[]>(
      'acl_module',
      context.getHandler(),
    );
    if (!permission || !module) {
      return false;
    }
    const request = context.switchToHttp().getRequest();
    if (
      request.url.split('/')[3] === 'register' &&
      request.body.organizationType === OrganizationType.ApiUser
    ) {
      this.logger.verbose(`When ${request.url.split('/')[3]}`);
      return true;
    }

    const user: IUser = request.user;
    if (!user) {
      return false;
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

    const userPermissionOne = await this.userPermission.findById(
      user.roleId,
      user.id,
      module,
    );

    userPermissionOne.forEach((e) => {
      e.permissions.forEach((element) => {
        if (!per.includes(element)) {
          per.push(element);
        }
      });
    });
    if (!userPermissionOne) {
      return false;
    }
    user.permissions = per;
    const loggedInUser = new LoggedInUser(user);

    const hasPermission = () =>
      loggedInUser.permissions.includes(permission[0]);

    return hasPermission();
  }
}

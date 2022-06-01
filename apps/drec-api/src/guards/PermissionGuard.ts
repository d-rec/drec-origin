//import { IUser, UserStatus } from '@energyweb/origin-backend-core';//
import { IUser, LoggedInUser } from '../models';
import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Inject
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccessControl } from 'role-acl';

import { PermissionService } from '../pods/permission/permission.service'
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector, @Inject(PermissionService) private readonly userPermission: PermissionService) { }
  //constructor(@Inject(KeyService) private keyService: KeyService) {}


  async canActivate(context: ExecutionContext): Promise<boolean> {

    const permission = this.reflector.get<string[]>('permission', context.getHandler());
    const module = this.reflector.get<string[]>('acl_module', context.getHandler());
    if (!permission || !module) {
      return false;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user as IUser;
   
    var per:any = [];
    const userpermission1 = await this.userPermission.findById(user.roleId, user.id, module);
  
    userpermission1.forEach((e) => {
      e.permissions.forEach(element => {
        if (!per.includes(element)) {
          per.push(element);
        }
      });

    });
    user.permissions=per;
    const loggedInUser = new LoggedInUser(user);
    const hasPermission =() => permission.includes(loggedInUser.permissions);
    console.log(hasPermission())
   
    return hasPermission();
  }
}

//import { IUser, UserStatus } from '@energyweb/origin-backend-core';//
import { IUser, LoggedInUser } from '../models';
import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
// import { AccessControl } from 'role-acl';

import { PermissionService } from '../pods/permission/permission.service';
import { OauthClientCredentials } from 'src/pods/user/oauth_client_credentials.entity';
import { UserService } from 'src/pods/user/user.service';
import { Role } from 'src/utils/enums';
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject(PermissionService)
    private readonly userPermission: PermissionService,
    @Inject(UserService)
    private readonly userService : UserService
  ) {}
  //constructor(@Inject(KeyService) private keyService: KeyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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
    let user : IUser;
      const client = request.user as OauthClientCredentials;
    if(request.url.split('/')[3] ===  'register') {
      console.log(request.url.split('/')[3]);
      if(request.body.organizationType === Role.ApiUser) {
        return true;
      }
      if(request.user.client_id != process.env.client_id) {
        console.log('client at request',client.api_user_id,request.user.api_user_id); 
        user = await this.userService.findOne({ api_user_id: client.api_user_id, role: Role.ApiUser });
        console.log(user);
      } 
      if(request.user.client_id === process.env.client_id) {
        console.log("With in if when id is same as from env")
        user = await this.userService.findOne({ api_user_id: client.api_user_id, role: Role.Admin });
      }
    }
    else {
      user = request.user;
    }
   
    if (user.role === 'Admin') {
      return true;
    }
    var per: any = [];
    console.log("user", user);
    const userpermission1 = await this.userPermission.findById(
      user.roleId,
      user.id,
      module,
    );
    console.log("userpermission1", userpermission1);
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
    console.log("loggedInUser",loggedInUser);
    console.log("permission from decorator",permission);

    const hasPermission = () =>
      loggedInUser.permissions.includes(permission[0]);
    console.log(hasPermission());

    return hasPermission();
  }
}

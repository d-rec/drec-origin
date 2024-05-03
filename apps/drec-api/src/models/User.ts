import { IEmailConfirmation, IFullOrganization } from '.';
import {
  Role,
  UserStatus,
  PermissionString,
  UserPermissionStatus,
} from '../utils/enums';
import { IModulePermissionsConfig } from './ACLModulesPermission';
export interface IUserProperties {
  id: number;
  title?: string;
  firstName: string;
  lastName: string;
  telephone?: string;
  email: string;
  notifications: boolean;
  status: UserStatus;
  role: Role;
  roleId?: number;
  permissions?: PermissionString;
  api_user_id?: string;
  permission_status?: UserPermissionStatus;
}

export interface IUserSeed extends IUser {
  password: string;

  organizationId: number;
}

export interface IUser extends IUserProperties {
  organization: IFullOrganization;

  moduleName?: string;
  emailConfirmed?: IEmailConfirmation['confirmed'];
}

export declare type UserRegisterReturnData = IUser;
export declare type UserLoginReturnData = {
  accessToken: string;
};
export declare type UserStatusUpdate = Partial<Pick<IUserProperties, 'status'>>;
export declare type UserPasswordUpdate = {
  oldPassword: string;
  newPassword: string;
};
export declare type UserChangePasswordUpdate = {
  newPassword: string;
};
export interface IFullUser extends IUser {
  password: string;
}

export declare type UpdateUserResponseReturnType = IUser;

export const isRole = (orgRole: Role, ...roles: Role[]): boolean =>
  roles.some((role) => role === orgRole);

export const isPermission = (
  userPermissions: PermissionString,
  ...permissions: PermissionString[]
): boolean => permissions.some((permission) => permission === userPermissions);

import { isRole, IUser, isPermission } from '.';
import { Role, PermissionString } from '../utils/enums';
import { IModulePermissionsConfig } from './ACLModulesPermission';
export interface ILoggedInUser {
  id: number;
  organizationId: number;
  email: string;
  blockchainAccountAddress: string | undefined;
  role: Role;
  hasRole(...role: Role[]): boolean;
  ownerId: string;
  hasOrganization: boolean;
  permissions: PermissionString;
  hasPermission(...permissions: PermissionString[]): boolean;
  api_user_id: string;
}

export class LoggedInUser implements ILoggedInUser {
  constructor(user: IUser) {
    this.id = user.id;
    this.organizationId = user.organization?.id;
    this.email = user.email;
    this.blockchainAccountAddress = user.organization?.blockchainAccountAddress;
    this.role = user.role;
    this.permissions = user.permissions;
    //@ts-ignore
    this.api_user_id = user.api_user_id;
  }

  id: number;

  organizationId: number;

  email: string;

  api_user_id: string;

  blockchainAccountAddress: string | undefined;

  role: Role;
  permissions: any;

  hasRole(...role: Role[]): boolean {
    //console.log("39");
    return isRole(this.role, ...role);
  }
  hasPermission(...permissions: PermissionString[]): boolean {
    //console.log("42");
    //console.log(this.permissions);
    //console.log(...permissions);
    //console.log(isPermission(this.permissions, ...permissions));

    return isPermission(this.permissions, ...permissions);
  }

  get ownerId(): string {
    return (this.organizationId ?? this.id).toString();
  }

  get hasOrganization(): boolean {
    return !!this.organizationId;
  }
}

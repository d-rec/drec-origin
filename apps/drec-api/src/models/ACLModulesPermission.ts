import { EntityType } from '../utils/enums';
import { IACLModuleConfig } from './ACLModules';

export interface IModulePermissionsConfig {
  id: number;
  // aclmoduleId: number;
  entityType: EntityType;
  entityId: number;
  permissions: string[];
  permissionValue: number;
  status: number;
}
export interface IACLmodulsPermissions extends IaddModulePermission {
  aclmodules: IACLModuleConfig;
}
export interface IaddModulePermission extends IModulePermissionsConfig {
  aclmodulesId: number;
}

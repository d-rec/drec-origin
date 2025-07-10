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
export interface IACLModulePermission extends IAddModulePermission {
  aclmodules: IACLModuleConfig;
}
export interface IAddModulePermission extends IModulePermissionsConfig {
  aclmodulesId: number;
}

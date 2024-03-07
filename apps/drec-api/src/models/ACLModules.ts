import { RoleStatus } from '../utils/enums';

export interface IACLModuleConfig {
  id: number;
  name: string;
  description: string;
  permissions: string[];
  permissionsValue: number;
  status: RoleStatus;
}

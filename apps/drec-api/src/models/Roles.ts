import {RoleStatus } from '../utils/enums';

export interface IRoleConfig {
    id: number;
    name: string;
    description: string;
  
    status:RoleStatus;
    
     }
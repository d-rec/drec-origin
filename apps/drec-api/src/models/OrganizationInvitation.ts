import { OrganizationInvitationStatus, Role } from '../utils/enums';
import { IPublicOrganization } from './Organization';

export type OrganizationRole = Role.DeviceOwner | Role.OrganizationAdmin | Role.User;

export interface IOrganizationInvitationProperties {
  id: number;
  email: string;
  role: OrganizationRole;
  status: OrganizationInvitationStatus;
}

export interface IOrganizationInvitation
  extends IOrganizationInvitationProperties {
  organization: IPublicOrganization;
  sender: string;
  createdAt: Date;
  permissionId?:number[];
}

export type OrganizationInviteCreateData = {
  email: string;
  role: OrganizationRole;
};

export type OrganizationInviteUpdateData = Pick<
  IOrganizationInvitation,
  'status'
>;

export const ensureOrganizationRole = (role: Role): void => {
  if (role !== Role.OrganizationAdmin && role !== Role.DeviceOwner && role !== Role.User) {
    throw new Error('Not an organization role');
  }
};

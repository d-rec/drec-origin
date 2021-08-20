import { IEmailConfirmation, IFullOrganization } from '.';
import { Role, UserStatus } from '../utils/eums';

export interface IUserProperties {
  id: number;
  title: string;
  firstName: string;
  lastName: string;
  telephone: string;
  email: string;
  notifications: boolean;
  status: UserStatus;
  role: Role;
  organizationId: number;
}

export interface IUser extends IUserProperties {
  organization?: IFullOrganization;
  emailConfirmed?: IEmailConfirmation['confirmed'];
}

export interface IFullUser extends IUser {
  password: string;
}

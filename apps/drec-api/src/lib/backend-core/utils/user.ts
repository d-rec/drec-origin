import { IEmailConfirmation } from './email-confirmation';
import { IFullOrganization } from './organization';

export type UserLoginReturnData = { accessToken: string };

export interface IUser extends IUserProperties {
  organization: IFullOrganization;
  emailConfirmed?: IEmailConfirmation['confirmed'];
}

export enum KYCStatus {
  Pending = 'Pending',
  Passed = 'Passed',
  Rejected = 'Rejected',
}

export enum UserStatus {
  Pending = 'Pending',
  Active = 'Active',
  Suspended = 'Suspended',
  Deleted = 'Deleted',
}

export type UserPasswordUpdate = { oldPassword: string; newPassword: string };

export interface IUserProperties {
  id: number;
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  telephone: string;
  notifications: boolean;
  rights: number;
  status: UserStatus;
  kycStatus: KYCStatus;
}

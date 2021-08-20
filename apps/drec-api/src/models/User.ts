import { IEmailConfirmation, IFullOrganization } from '.';
import { Role, UserStatus } from '../utils/enums';

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
}

export interface IUserSeed extends IUser {
  password: string;
  organizationId: number;
}

export interface IUser extends IUserProperties {
  organization: IFullOrganization;
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
export interface IFullUser extends IUser {
  password: string;
}
export declare type UpdateUserResponseReturnType = IUser;

export const isRole = (orgRole: Role, ...roles: Role[]): boolean =>
  roles.some((role) => role === orgRole);

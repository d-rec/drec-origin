import { isRole, IUser } from '.';
import { Role } from '../utils/enums';

export interface ILoggedInUser {
  id: number;
  organizationId: number;
  email: string;
  blockchainAccountAddress: string | undefined;
  role: Role;
  hasRole(...role: Role[]): boolean;
  ownerId: string;
  hasOrganization: boolean;
}

export class LoggedInUser implements ILoggedInUser {
  constructor(user: IUser) {
    this.id = user.id;
    this.organizationId = user.organization?.id;
    this.email = user.email;
    this.blockchainAccountAddress = user.organization?.blockchainAccountAddress;
    this.role = user.role;
  }

  id: number;

  organizationId: number;

  email: string;

  blockchainAccountAddress: string | undefined;

  role: Role;

  hasRole(...role: Role[]): boolean {
    return isRole(this.role, ...role);
  }

  get ownerId(): string {
    return (this.organizationId ?? this.id).toString();
  }

  get hasOrganization(): boolean {
    return !!this.organizationId;
  }
}

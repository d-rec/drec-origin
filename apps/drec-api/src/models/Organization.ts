import { OrganizationStatus, Role } from '../utils/enums';

export class IPublicOrganization {
  id: number;
  name: string;
  address: string;
  zipCode: string;
  city: string;
  country: string;
  businessType: string;
  tradeRegistryCompanyNumber: string;
  vatNumber: string;
  status: OrganizationStatus;
  blockchainAccountAddress?: string;
}

export interface IFullOrganization extends IPublicOrganization {
  signatoryFullName: string;
  signatoryAddress: string;
  signatoryZipCode: string;
  signatoryCity: string;
  signatoryCountry: string;
  signatoryEmail: string;
  signatoryPhoneNumber: string;
}

export interface IOrganizationUpdateMemberRole {
  role: Role;
}

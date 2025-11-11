export enum OrganizationStatus {
  Submitted = 'Submitted',
  Denied = 'Denied',
  Active = 'Active',
}

export interface IPublicOrganization {
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
  blockchainAccountSignedMessage?: string;
}

export interface IFullOrganization extends IPublicOrganization {
  signatoryFullName: string;
  signatoryAddress: string;
  signatoryZipCode: string;
  signatoryCity: string;
  signatoryCountry: string;
  signatoryEmail: string;
  signatoryPhoneNumber: string;
  signatoryDocumentIds?: string[];
  documentIds?: string[];
  selfOwnership?: boolean;
}

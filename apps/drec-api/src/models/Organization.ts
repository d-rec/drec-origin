import { OrganizationStatus, Role } from '../utils/enums';



export class IPublicAddOrganization {
  id: number;
  name: string;

  organizationType: string;
  secretKey:string;
  status: OrganizationStatus;

}
export class IPublicOrganization {
  id: number;
  name: string;
  address: string;
  zipCode: string;
  city: string;
  country: string;
  organizationType: string;
  
  status: OrganizationStatus;

  blockchainAccountAddress?: string;
  blockchainAccountSignedMessage?: string;
}

export interface IFullOrganization extends IPublicOrganization {
 
  signatoryDocumentIds?: string[];
  documentIds?: string[];
}

export interface IOrganizationUpdateMemberRole {
  role: Role;
}

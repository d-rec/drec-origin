export interface OrganizationInformation
{
    id: number;
    name: string;
  //  secretKey: string;
    address: string;
    zipCode: string;
    city: string;
    country: string;
    organizationType: string;
    status: string;
    documentIds: string[];
    signatoryDocumentIds: string[];
    blockchainAccountAddress: string;
    blockchainAccountSignedMessage: string;   
}
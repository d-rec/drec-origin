import { ICertificate as IOriginalCertificate } from '../types/utils/certificates';
import { StandardCompliance, CertificateType } from './enums';

export interface ICertificateMetadata {
  version: string;
  deviceIds: string[];
  //deviceGroup: DeviceGroupDTO;
  groupId: null | string;
  buyerReservationId?: string;
  isStandardIssuanceRequested?: StandardCompliance;
  type?: CertificateType;
  certificateTransactionUID?: string;
  //isStandardIssued?:boolean;
}

export type ICertificate = IOriginalCertificate<ICertificateMetadata>;

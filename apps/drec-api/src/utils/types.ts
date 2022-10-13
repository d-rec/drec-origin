import { ICertificate as IOriginalCertificate } from '@energyweb/origin-247-certificate';
import { DeviceGroupDTO } from '../pods/device-group/dto';
import { StandardCompliance,CertificateType } from './enums';

export interface ICertificateMetadata {
  version:string;
  deviceIds: number[];
  //deviceGroup: DeviceGroupDTO;
  groupId: null | string;
  buyerReservationId?:string;
  isStandardIssuanceRequested?:StandardCompliance;
  type?:CertificateType;
  //isStandardIssued?:boolean;
}

export type ICertificate = IOriginalCertificate<ICertificateMetadata>;

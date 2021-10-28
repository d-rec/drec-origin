import { ICertificate as IOriginalCertificate } from '@energyweb/origin-247-certificate';
import { DeviceGroupDTO } from '../pods/device-group/dto';

export interface ICertificateMetadata {
  deviceIds: number[];
  deviceGroup: DeviceGroupDTO;
  groupId: null | string;
}

export type ICertificate = IOriginalCertificate<ICertificateMetadata>;

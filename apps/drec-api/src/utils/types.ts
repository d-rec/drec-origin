import { ICertificate as IOriginalCertificate } from '@energyweb/origin-247-certificate';

export interface ICertificateMetadata {
  deviceIds: number[];
  groupId: null | string;
}

export type ICertificate = IOriginalCertificate<ICertificateMetadata>;

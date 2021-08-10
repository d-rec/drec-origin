import { ICertificate as IOriginalCertificate } from '@energyweb/origin-247-certificate';

/**
 * Certificate source allows to describe how the certificate was issued.
 * It can be issued by various entities like battery or generator itself
 */
export interface ICertificateMetadata {
  deviceIds: number[];
  id: string;
}

export type ICertificate = IOriginalCertificate<ICertificateMetadata>;

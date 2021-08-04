import { ICertificate as IOriginalCertificate } from '@energyweb/origin-247-certificate';

export type EICCode = string;

export enum CertificateSourceType {
  Generator = 'generator',
  Battery = 'battery',
}

/**
 * Certificate source allows to describe how the certificate was issued.
 * It can be issued by various entities like battery or generator itself
 */
export interface ICertificateSource {
  type: CertificateSourceType;
  deviceIds: number[];
  id?: string;
}

export type ICertificate = IOriginalCertificate<ICertificateSource>;

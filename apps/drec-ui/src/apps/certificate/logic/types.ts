import { CertificateDTO, CertificateEvent } from '@energyweb/origin-drec-api-client';

export type ApiDownloadFunction = (id: string) => Promise<any>;

export type DetailedCertificate = {
    blockchainPart: CertificateDTO;
    events: CertificateEvent[];
};

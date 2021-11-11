import { CertificateDTO } from '@energyweb/origin-drec-api-client';
import { useAllBlockchainCertificates } from './blockchainCertificates';

export const useRedeemedCertificates = () => {
    const { blockchainCertificates, isLoading } = useAllBlockchainCertificates();

    const redeemedCertificates: CertificateDTO['myClaims'] = [];

    blockchainCertificates?.forEach(
        (certificate) =>
            certificate.claims.length > 0 && redeemedCertificates.push(...certificate.myClaims)
    );

    return { redeemedCertificates, blockchainCertificates, isLoading };
};

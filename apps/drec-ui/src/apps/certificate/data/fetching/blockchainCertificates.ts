import { useCertificateControllerGetAll } from '@energyweb/origin-drec-api-client';

export const useAllBlockchainCertificates = () => {
    const { data: blockchainCertificates, isLoading } = useCertificateControllerGetAll();

    return { blockchainCertificates, isLoading };
};

import { useCertificateControllerGetAll } from '@energyweb/origin-drec-api-client/dist/js/src';

export const useAllBlockchainCertificates = () => {
    const { data: blockchainCertificates, isLoading } = useCertificateControllerGetAll();

    return { blockchainCertificates, isLoading };
};

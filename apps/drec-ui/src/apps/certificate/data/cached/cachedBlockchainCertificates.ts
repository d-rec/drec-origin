import {
    CertificateDTO,
    getCertificateControllerGetAllQueryKey
} from '@energyweb/origin-drec-api-client';
import { useQueryClient } from 'react-query';

export const useCachedBlockchainCertificates = () => {
    const queryClient = useQueryClient();
    const blockchainCertificatesQueryKey = getCertificateControllerGetAllQueryKey();

    return queryClient.getQueryData<CertificateDTO[]>(blockchainCertificatesQueryKey);
};

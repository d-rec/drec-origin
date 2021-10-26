import {
    useCertificateControllerGet,
    useCertificateControllerGetAllEvents
} from '@energyweb/origin-drec-api-client';
import { DetailedCertificate } from '../../types';

export const useCertificateDetailedData = (id: string) => {
    const { data: blockchainCertificate, isLoading: isBlockchainCertificateLoading } =
        useCertificateControllerGet(parseInt(id));

    const { data: blockchainEvents, isLoading: areEventsLoading } =
        useCertificateControllerGetAllEvents(parseInt(id));

    const certificate: DetailedCertificate = {
        blockchainPart: {
            ...blockchainCertificate
        },
        events: blockchainEvents
    };

    const isLoading = isBlockchainCertificateLoading || areEventsLoading;

    return { certificate, isLoading };
};

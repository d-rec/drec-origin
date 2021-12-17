import { useCertificateBlockchainEventsLogic, useCertificateDataLogic } from '../../../../logic';
import { DetailedCertificate } from '../../../../types';

export const useCertificateDetailsEffects = (certificate: DetailedCertificate) => {
    const certificateData = useCertificateDataLogic(certificate);
    const eventsData = useCertificateBlockchainEventsLogic(certificate);

    const blockhainTransactionsTitle = 'Blockchain Transactions';
    return {
        ...certificateData,
        eventsData,
        blockhainTransactionsTitle
    };
};

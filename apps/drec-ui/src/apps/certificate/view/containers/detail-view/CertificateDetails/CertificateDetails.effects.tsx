import { useCertificateDataLogic } from '../../../../logic';
import { DetailedCertificate } from '../../../../types';

export const useCertificateDetailsEffects = (certificate: DetailedCertificate) => {
    const certificateData = useCertificateDataLogic(certificate);

    return {
        ...certificateData
    };
};

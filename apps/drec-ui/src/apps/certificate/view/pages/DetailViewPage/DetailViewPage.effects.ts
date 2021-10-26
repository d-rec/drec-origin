import { useParams } from 'react-router';
import { useCertificateDetailedData, useDeviceGroupByExternalRegistryId } from '../../../data';

export const useDetailedPageViewEffects = () => {
    const { id } = useParams();

    const { certificate, isLoading: isCertificateLoading } = useCertificateDetailedData(id);
    const { deviceGroup, isLoading: isDeviceGroupLoading } = useDeviceGroupByExternalRegistryId(
        certificate?.blockchainPart?.deviceId
    );

    const isLoading = isCertificateLoading || isDeviceGroupLoading;

    return { certificate, isLoading, deviceGroup };
};

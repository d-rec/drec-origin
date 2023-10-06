import { useParams } from 'react-router';
import { useCertificateDetailedData, useDeviceGroupByExternalRegistryId } from '../../../data';
import { useMetadataFromCertificate } from '../../../logic';

export const useDetailedPageViewEffects = () => {
    const { id } = useParams();

    const { certificate, isLoading: isCertificateLoading } = useCertificateDetailedData(id);
    const { foundDeviceGroup, isLoading: isDeviceGroupLoading } =
        useDeviceGroupByExternalRegistryId(certificate?.blockchainPart?.deviceId);

    const deviceGroup = useMetadataFromCertificate(certificate, foundDeviceGroup);
    const isLoading = isCertificateLoading || isDeviceGroupLoading;

    return { certificate, isLoading, deviceGroup };
};

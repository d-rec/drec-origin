import { DeviceGroupDTO } from '@energyweb/origin-drec-api-client/dist/js/src';
import { CertificateMetadata, DetailedCertificate } from '../../types';

export const useMetadataFromCertificate = (
    certificate: DetailedCertificate,
    deviceGroup: DeviceGroupDTO
): DeviceGroupDTO => {
    if (!deviceGroup && certificate?.blockchainPart?.metadata) {
        const certificateMetadata = JSON.parse(
            certificate?.blockchainPart?.metadata || ''
        ) as CertificateMetadata;
        return certificateMetadata.deviceGroup;
    } else {
        return deviceGroup;
    }
};

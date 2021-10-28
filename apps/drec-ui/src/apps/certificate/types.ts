import {
    CertificateDTO,
    DeviceGroupDTO,
    CertificateEvent
} from '@energyweb/origin-drec-api-client';
import { AxiosResponse } from 'axios';

export type ApiDownloadFunction = (id: string) => Promise<AxiosResponse<any>>;

export type DetailedCertificate = {
    blockchainPart: CertificateDTO;
    events: CertificateEvent[];
};

export type CertificateMetadata = {
    deviceIds: number[];
    deviceGroup: DeviceGroupDTO;
    groupId: null | string;
};

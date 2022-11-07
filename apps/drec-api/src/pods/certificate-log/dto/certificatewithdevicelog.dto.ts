
import { Certificate } from '@energyweb/issuer-api';
import { CheckCertificateIssueDateLogForDeviceEntity } from '../../device/check_certificate_issue_date_log_for_device.entity'

export class CertificateWithPerdevicelog extends Certificate {
    id: number;
    deviceId: string;
    generationStartTime: number;
    generationEndTime: number;
    certificateStartDate:string;
    certificateEndDate:string;
    creationTime: number;
    perDeviceCertificateLog: CheckCertificateIssueDateLogForDeviceEntity[];
    metadata:string;
    
}

import { Certificate } from '@energyweb/issuer-api';
import { CheckCertificateIssueDateLogForDeviceEntity } from '../../device/check_certificate_issue_date_log_for_device.entity';

export class CertificateWithPerDeviceLog extends Certificate {
  id: number;
  deviceId: string;
  generationStartTime: number;
  generationEndTime: number;
  certificateStartDate: string;
  certificateEndDate: string;
  creationTime: number;
  perDeviceCertificateLog: CheckCertificateIssueDateLogForDeviceEntity[];
  metadata: string;
}

export class CertificateNewWithPerDeviceLog {
  certificateStartDate: string;
  certificateEndDate: string;
  perDeviceCertificateLog: CheckCertificateIssueDateLogForDeviceEntity[];
}

export class CertificateLogResponse {
  certificatelog:
    | CertificateNewWithPerDeviceLog[]
    | CertificateWithPerDeviceLog[];
  currentpage?: number;
  totalPages: number;
  totalCount: number;
}

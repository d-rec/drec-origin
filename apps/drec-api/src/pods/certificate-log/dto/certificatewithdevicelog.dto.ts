import { Certificate } from '@energyweb/issuer-api';
import { CheckCertificateIssueDateLogForDeviceEntity } from '../../device/check_certificate_issue_date_log_for_device.entity';
import { ICertificateReadModel } from '@energyweb/origin-247-certificate';
import { ICertificateMetadata } from '../../../utils/types';

export class CertificateWithPerdevicelog extends Certificate {
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

export type CertificateNewWithPerDeviceLog =
  ICertificateReadModel<ICertificateMetadata>;

export class CertificateNewWithPerDeviceLog {
  certificateStartDate: string;
  certificateEndDate: string;
  perDeviceCertificateLog: CheckCertificateIssueDateLogForDeviceEntity[];
}

export class CertificatelogResponse {
  certificatelog:
    | CertificateNewWithPerDeviceLog[]
    | CertificateWithPerdevicelog[];
  totalPages: number;
  totalCount: number;
}

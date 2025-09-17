import { Certificate } from '@energyweb/issuer-api';
import { CheckCertificateIssueDateLogForDeviceEntity } from '../../device/check_certificate_issue_date_log_for_device.entity';
import { ICertificateMetadata } from '../../../utils/types';
import { IClaim } from '@energyweb/issuer';
import { ICertificateReadModel } from '../../../types/utils/certificates';
import { CertificateTransaction } from '../../utils/origin-247-certificate/offchain-certificate/repositories/certificate-read-modal/certificate-read-model.entity';

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

export class CertificateNewWithPerDeviceLog
  implements ICertificateReadModel<ICertificateMetadata>
{
  internalCertificateId: number;
  blockchainCertificateId: number;
  deviceId: string;
  generationStartTime: number;
  generationEndTime: number;
  creationTime: number;
  metadata: ICertificateMetadata;
  creationBlockHash: string;
  claims: IClaim[];
  owners: Record<string, string>;
  claimers: Record<string, string>;
  isSynced: boolean;
  transactions: CertificateTransaction[];
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

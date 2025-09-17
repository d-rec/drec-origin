import {
  CertificateUtils,
  IClaim,
  IOwnershipCommitmentProof,
} from '@energyweb/issuer';
import {
  IBatchClaimCommand,
  IBatchIssueCommand,
  IBatchTransferCommand,
  IClaimCommand,
  IIssueCommand,
  ITransferCommand,
} from '../../../../types/utils/issuer';

export interface ICertificate<T = null> {
  id: number;
  deviceId: string;
  generationStartTime: number;
  generationEndTime: number;
  creationTime: number;
  metadata: T;
  creationTransactionHash: string;
  owners: CertificateUtils.IShareInCertificate;
  claimers: CertificateUtils.IShareInCertificate;
  claims: IClaim[];
  issuedPrivately: boolean;
  latestCommitment: IOwnershipCommitmentProof | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISuccessResponse {
  success: boolean;
  statusCode?: number;
  message?: string;
}

export enum BlockchainActionType {
  Issuance = 'Issuance',
  Transfer = 'Transfer',
  Claim = 'Claim',
  BatchIssuance = 'BatchIssuance',
  BatchTransfer = 'BatchTransfer',
  BatchClaim = 'BatchClaim',
}

interface IAction<T, P> {
  type: T;
  payload: P;
}

export type BlockchainAction =
  | IAction<BlockchainActionType.Issuance, IIssueCommand<any>>
  | IAction<BlockchainActionType.Transfer, ITransferCommand>
  | IAction<BlockchainActionType.Claim, IClaimCommand>
  | IAction<BlockchainActionType.BatchIssuance, IBatchIssueCommand<any>>
  | IAction<BlockchainActionType.BatchTransfer, IBatchTransferCommand>
  | IAction<BlockchainActionType.BatchClaim, IBatchClaimCommand>;

export const ONCHAIN_CERTIFICATE_SERVICE_TOKEN = Symbol.for(
  'ONCHAIN_CERTIFICATE_SERVICE_TOKEN',
);

export interface DeploymentProperties {
  registry: string;
  issuer: string;
}

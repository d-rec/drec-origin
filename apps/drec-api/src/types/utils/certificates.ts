import { CertificateUtils, IClaim, IOwnershipCommitmentProof } from "@energyweb/issuer";
import { CertificateEventEntity } from "../../pods/utils/origin-247-certificate/offchain-certificate/repositories/certificate-event/certificate-event.entity";
import { DeploymentPropertiesEntity } from "../../pods/utils/origin-247-certificate/deployment-properties.entity";
import { CertificateSynchronizationAttemptEntity } from "../../pods/utils/origin-247-certificate/offchain-certificate/synchronize/certificate-synchronization-attempt.entity";
import { CertificateCommandEntity } from "../../pods/utils/origin-247-certificate/offchain-certificate/repositories/certificate-command/certificate-command.entity";
import { CertificateReadModelEntity, CertificateTransaction } from "../../pods/utils/origin-247-certificate/offchain-certificate/repositories/certificate-read-modal/certificate-read-model.entity";

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

export const OffChainCertificateEntities = [
    CertificateSynchronizationAttemptEntity,
    CertificateEventEntity,
    CertificateCommandEntity,
    CertificateReadModelEntity
];

export const OnChainCertificateEntities = [DeploymentPropertiesEntity];

export enum CertificateEventType {
    Issued = 'Issued',
    Transferred = 'Transferred',
    Claimed = 'Claimed',
    IssuancePersisted = 'IssuancePersisted',
    TransferPersisted = 'TransferPersisted',
    ClaimPersisted = 'ClaimPersisted',
    PersistError = 'PersistError'
}

export interface ICertificateEvent {
    id: number;
    type: CertificateEventType;
    version: number;
    internalCertificateId: number;
    payload: unknown;
    createdAt: Date;
}

export interface ICertificateReadModel<T> {
    internalCertificateId: number;
    blockchainCertificateId: number | null;
    deviceId: string;
    generationStartTime: number;
    generationEndTime: number;
    creationTime: number;
    metadata: T;
    creationBlockHash: string;
    claims: IClaim[];
    owners: Record<string, string>;
    claimers: Record<string, string> | null;
    isSynced: boolean;
    transactions: CertificateTransaction[];
}

export interface IClaimPersistedCommand {
    persistedEventId: number;
    transactionHash: string;
}

export interface IIssuancePersistedCommand {
    persistedEventId: number;
    blockchainCertificateId: number;
    transactionHash: string;
}

export interface ITransferPersistedCommand {
    persistedEventId: number;
    transactionHash: string;
}

export interface IPersistErrorCommand {
    internalCertificateId: number;
    persistedEventId: number;
    type: CertificateEventType;
    errorMessage: string;
}

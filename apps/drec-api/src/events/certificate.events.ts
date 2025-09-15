import { IClaimCommand, IIssueCommand, ITransferCommand } from "../types/utils/issuer";

const version = 1;

export const isTransferEvent = (e: ICertificateEvent): e is CertificateTransferredEvent =>
    e.type === CertificateEventType.Transferred;

export const isIssueEvent = (e: ICertificateEvent): e is CertificateIssuedEvent =>
    e.type === CertificateEventType.Issued;

export const isIssuePersistedEvent = (
    e: ICertificateEvent
): e is CertificateIssuancePersistedEvent => e.type === CertificateEventType.IssuancePersisted;

export const isClaimEvent = (e: ICertificateEvent): e is CertificateClaimedEvent =>
    e.type === CertificateEventType.Claimed;

export const isPersistedEvent = (e: ICertificateEvent): e is PersistedEvent =>
    [
        CertificateEventType.ClaimPersisted,
        CertificateEventType.IssuancePersisted,
        CertificateEventType.TransferPersisted,
        CertificateEventType.PersistError
    ].includes(e.type);

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

export type PersistedEvent =
    | CertificateIssuancePersistedEvent
    | CertificateClaimPersistedEvent
    | CertificateTransferPersistedEvent
    | CertificatePersistErrorEvent;

export class CertificateIssuedEvent<MetadataType = unknown> implements ICertificateEvent {
    public readonly type = CertificateEventType.Issued;
    public readonly version = version;
    public readonly createdAt = new Date();

    private constructor(
        private readonly _id: number,
        public readonly internalCertificateId: number,
        public readonly payload: IIssueCommand<MetadataType>
    ) {}

    public get id() {
        if (this._id === -1) {
            throw new Error('Certificate event has not been saved, and has not set id');
        }

        return this._id;
    }

    public static createNew<T = unknown>(
        internalCertificateId: number,
        payload: IIssueCommand<T>
    ): CertificateIssuedEvent<T> {
        return new CertificateIssuedEvent(-1, internalCertificateId, payload);
    }
}

export class CertificateTransferredEvent implements ICertificateEvent {
    public readonly type = CertificateEventType.Transferred;
    public readonly version = version;
    public readonly createdAt = new Date();

    private constructor(
        private readonly _id: number,
        public readonly internalCertificateId: number,
        public readonly payload: ITransferCommand
    ) {}

    public get id() {
        if (this._id === -1) {
            throw new Error('Certificate event has not been saved, and has not set id');
        }

        return this._id;
    }

    public static createNew(
        internalCertificateId: number,
        payload: ITransferCommand
    ): CertificateTransferredEvent {
        return new CertificateTransferredEvent(-1, internalCertificateId, payload);
    }
}

export class CertificateClaimedEvent implements ICertificateEvent {
    public readonly type = CertificateEventType.Claimed;
    public readonly version = version;
    public readonly createdAt = new Date();

    private constructor(
        private readonly _id: number,
        public readonly internalCertificateId: number,
        public readonly payload: IClaimCommand
    ) {}

    public get id() {
        if (this._id === -1) {
            throw new Error('Certificate event has not been saved, and has not set id');
        }

        return this._id;
    }

    public static createNew(
        internalCertificateId: number,
        payload: IClaimCommand
    ): CertificateClaimedEvent {
        return new CertificateClaimedEvent(-1, internalCertificateId, payload);
    }
}

export class CertificateIssuancePersistedEvent implements ICertificateEvent {
    public readonly type = CertificateEventType.IssuancePersisted;
    public readonly version = version;
    public readonly createdAt = new Date();

    private constructor(
        private readonly _id: number,
        public readonly internalCertificateId: number,
        public readonly payload: {
            blockchainCertificateId: number;
            persistedEventId: number;
            transactionHash: string;
        }
    ) {}

    public get id() {
        if (this._id === -1) {
            throw new Error('Certificate event has not been saved, and has not set id');
        }

        return this._id;
    }

    public static createNew(
        internalCertificateId: number,
        payload: CertificateIssuancePersistedEvent['payload']
    ): CertificateIssuancePersistedEvent {
        return new CertificateIssuancePersistedEvent(-1, internalCertificateId, payload);
    }
}

export class CertificateTransferPersistedEvent implements ICertificateEvent {
    public readonly type = CertificateEventType.TransferPersisted;
    public readonly version = version;
    public readonly createdAt = new Date();

    private constructor(
        private readonly _id: number,
        public readonly internalCertificateId: number,
        public readonly payload: { persistedEventId: number; transactionHash: string }
    ) {}

    public get id() {
        if (this._id === -1) {
            throw new Error('Certificate event has not been saved, and has not set id');
        }

        return this._id;
    }

    public static createNew(
        internalCertificateId: number,
        payload: CertificateTransferPersistedEvent['payload']
    ): CertificateTransferPersistedEvent {
        return new CertificateTransferPersistedEvent(-1, internalCertificateId, payload);
    }
}

export class CertificateClaimPersistedEvent implements ICertificateEvent {
    public readonly type = CertificateEventType.ClaimPersisted;
    public readonly version = version;
    public readonly createdAt = new Date();

    private constructor(
        private readonly _id: number,
        public readonly internalCertificateId: number,
        public readonly payload: { persistedEventId: number; transactionHash: string }
    ) {}

    public get id() {
        if (this._id === -1) {
            throw new Error('Certificate event has not been saved, and has not set id');
        }

        return this._id;
    }

    public static createNew(
        internalCertificateId: number,
        payload: CertificateClaimPersistedEvent['payload']
    ): CertificateClaimPersistedEvent {
        return new CertificateClaimPersistedEvent(-1, internalCertificateId, payload);
    }
}

export class CertificatePersistErrorEvent implements ICertificateEvent {
    public readonly type = CertificateEventType.PersistError;
    public readonly version = version;
    public readonly createdAt = new Date();

    private constructor(
        private readonly _id: number,
        public readonly internalCertificateId: number,
        public readonly payload: { errorMessage: string; persistedEventId: number }
    ) {}

    public get id() {
        if (this._id === -1) {
            throw new Error('Certificate event has not been saved, and has not set id');
        }

        return this._id;
    }

    public static createNew(
        internalCertificateId: number,
        payload: CertificatePersistErrorEvent['payload']
    ): CertificatePersistErrorEvent {
        return new CertificatePersistErrorEvent(-1, internalCertificateId, payload);
    }
}

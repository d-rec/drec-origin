import { BigNumber } from "ethers";
import { CertificateClaimedEvent, CertificateClaimPersistedEvent, CertificateIssuancePersistedEvent, CertificateIssuedEvent, CertificatePersistErrorEvent, CertificateTransferPersistedEvent, CertificateTransferredEvent } from "../../../events/certificate.events";
import { CertificateEventType, ICertificateEvent, ICertificateReadModel } from "../../../types/utils/certificates";
import { CertificateErrors } from "./errors";
import { compareDates } from "../../../utils/date";

type Cert<T> = ICertificateReadModel<T>;

export class CertificateAggregate<T> {
    private certificate: Cert<T>;

    private constructor(events: ICertificateEvent[]) {
        const sortedEvents = [...events].sort((a, b) => compareDates(a.createdAt, b.createdAt));
        const [firstEvent, ...restEvents] = sortedEvents;

        if (!firstEvent) {
            throw new CertificateErrors.CertificateNoEvents();
        }

        if (firstEvent.type !== CertificateEventType.Issued) {
            throw new CertificateErrors.FirstCertificateEventIsNotIssuance(
                firstEvent.internalCertificateId,
                firstEvent.type
            );
        }

        const initialCertificate = this.createCertificate(firstEvent as CertificateIssuedEvent<T>);

        this.certificate = {
            ...restEvents.reduce(this.apply.bind(this), initialCertificate),
            isSynced: this.reduceIsSynced(events)
        };
    }

    private apply(certificate: Cert<T>, event: ICertificateEvent): Cert<T> {
        switch (event.type) {
            case CertificateEventType.Issued:
                return this.issue(certificate, event as CertificateIssuedEvent);
            case CertificateEventType.Transferred:
                return this.transfer(certificate, event as CertificateTransferredEvent);
            case CertificateEventType.Claimed:
                return this.claim(certificate, event as CertificateClaimedEvent);
            case CertificateEventType.ClaimPersisted:
                return this.claimPersisted(certificate, event as CertificateClaimPersistedEvent);
            case CertificateEventType.IssuancePersisted:
                return this.issuancePersisted(
                    certificate,
                    event as CertificateIssuancePersistedEvent
                );
            case CertificateEventType.TransferPersisted:
                return this.transferPersisted(
                    certificate,
                    event as CertificateTransferPersistedEvent
                );
            case CertificateEventType.PersistError:
                return this.persistError(certificate, event as CertificatePersistErrorEvent);
            default:
                throw new CertificateErrors.UnknownEventType(
                    event.internalCertificateId,
                    event.type
                );
        }
    }

    public getCertificate(): Cert<T> {
        return this.certificate;
    }

    public static fromEvents<T>(events: ICertificateEvent[]): CertificateAggregate<T> {
        return new CertificateAggregate(events);
    }

    private createCertificate(event: CertificateIssuedEvent<T>): Cert<T> {
        const { payload } = event;

        return {
            internalCertificateId: event.internalCertificateId,
            blockchainCertificateId: null,
            claims: [],
            creationBlockHash: '',
            creationTime: Math.floor(Date.now() / 1000),
            deviceId: payload.deviceId,
            generationStartTime: payload.fromTime,
            generationEndTime: payload.toTime,
            metadata: payload.metadata,
            owners: {
                [payload.toAddress]: payload.energyValue
            },
            claimers: {},
            isSynced: false,
            transactions: []
        };
    }

    private persistError(certificate: Cert<T>, event: CertificatePersistErrorEvent): Cert<T> {
        return certificate;
    }

    private issue(certificate: Cert<T>, event: CertificateIssuedEvent): Cert<T> {
        throw new CertificateErrors.Issuance.CertificateAlreadyIssued(event.internalCertificateId);
    }

    private issuancePersisted(
        certificate: Cert<T>,
        event: CertificateIssuancePersistedEvent
    ): Cert<T> {
        const { blockchainCertificateId } = event.payload;

        return {
            ...certificate,
            blockchainCertificateId,
            transactions: [
                ...certificate.transactions,
                {
                    eventType: CertificateEventType.IssuancePersisted,
                    timestamp: event.createdAt,
                    transactionHash: event.payload.transactionHash
                }
            ]
        };
    }

    private transfer(certificate: Cert<T>, event: CertificateTransferredEvent): Cert<T> {
        this.validateTransfer(certificate, event);

        const { fromAddress, toAddress, energyValue } = event.payload;

        const fromBalance = BigNumber.from(certificate.owners[fromAddress] ?? '0');
        const toBalance = BigNumber.from(certificate.owners[toAddress] ?? '0');

        const newFromBalance = fromBalance.sub(energyValue);
        const newToBalance = toBalance.add(energyValue);

        return {
            ...certificate,
            owners: {
                ...certificate.owners,
                [fromAddress]: newFromBalance.toString(),
                [toAddress]: newToBalance.toString()
            }
        };
    }

    private transferPersisted(
        certificate: Cert<T>,
        event: CertificateTransferPersistedEvent
    ): Cert<T> {
        return {
            ...certificate,
            transactions: [
                ...certificate.transactions,
                {
                    eventType: CertificateEventType.TransferPersisted,
                    timestamp: event.createdAt,
                    transactionHash: event.payload.transactionHash
                }
            ]
        };
    }

    private claim(certificate: Cert<T>, event: CertificateClaimedEvent): Cert<T> {
        this.validateClaim(certificate, event);

        const { forAddress, energyValue, claimData } = event.payload;
        // claims happen for the same address

        const unclaimedBalance = BigNumber.from(certificate.owners[forAddress]);
        const claimedBalance = BigNumber.from(
            certificate.claimers![forAddress] ? certificate.claimers![forAddress] : '0'
        );

        const newUnclaimedBalance = unclaimedBalance.sub(energyValue);
        const newClaimedBalance = claimedBalance.add(energyValue);

        return {
            ...certificate,
            owners: {
                ...certificate.owners,
                [forAddress]: newUnclaimedBalance.toString()
            },
            claimers: {
                ...certificate.claimers,
                [forAddress]: newClaimedBalance.toString()
            },
            claims: [
                ...certificate.claims,
                {
                    id: event.internalCertificateId,
                    from: forAddress,
                    to: forAddress,
                    topic: '',
                    value: energyValue,
                    claimData: claimData
                }
            ]
        };
    }

    private claimPersisted(certificate: Cert<T>, event: CertificateClaimPersistedEvent): Cert<T> {
        return {
            ...certificate,
            transactions: [
                ...certificate.transactions,
                {
                    eventType: CertificateEventType.ClaimPersisted,
                    timestamp: event.createdAt,
                    transactionHash: event.payload.transactionHash
                }
            ]
        };
    }

    private validateTransfer(certificate: Cert<T>, event: CertificateTransferredEvent): void {
        const {
            internalCertificateId,
            payload: { fromAddress, toAddress, energyValue }
        } = event;

        if (this.isZeroAddress(fromAddress)) {
            throw new CertificateErrors.Transfer.FromZeroAddress(internalCertificateId);
        }

        if (this.isZeroAddress(toAddress)) {
            throw new CertificateErrors.Transfer.ToZeroAddress(internalCertificateId);
        }

        if (!this.hasEnoughBalance(certificate, fromAddress, energyValue)) {
            throw new CertificateErrors.Transfer.NotEnoughBalance(
                internalCertificateId,
                fromAddress
            );
        }
    }

    private validateClaim(certificate: Cert<T>, event: CertificateClaimedEvent): void {
        const {
            internalCertificateId,
            payload: { forAddress, energyValue }
        } = event;

        if (this.isZeroAddress(forAddress)) {
            throw new CertificateErrors.Claim.ForZeroAddress(internalCertificateId);
        }

        if (!this.hasEnoughBalance(certificate, forAddress, energyValue)) {
            throw new CertificateErrors.Claim.NotEnoughBalance(internalCertificateId, forAddress);
        }
    }

    private isZeroAddress(address: string): boolean {
        return parseInt(address, 16) === 0;
    }

    private hasEnoughBalance(certificate: Cert<T>, address: string, volume: string): boolean {
        const addressBalance = certificate.owners[address];
        return (
            addressBalance !== undefined &&
            BigNumber.from(addressBalance).gte(BigNumber.from(volume))
        );
    }

    private reduceIsSynced(events: ICertificateEvent[]): boolean {
        const toPersistCounter = events.reduce((toPersistCounter, event) => {
            switch (event.type) {
                case CertificateEventType.Issued:
                case CertificateEventType.Transferred:
                case CertificateEventType.Claimed:
                    return toPersistCounter + 1;
                case CertificateEventType.ClaimPersisted:
                case CertificateEventType.IssuancePersisted:
                case CertificateEventType.TransferPersisted:
                    return toPersistCounter - 1;
                case CertificateEventType.PersistError:
                    return toPersistCounter;
                default:
                    throw new CertificateErrors.UnknownEventType(
                        event.internalCertificateId,
                        event.type
                    );
            }
        }, 0);

        if (toPersistCounter > 0) {
            return false;
        } else if (toPersistCounter === 0) {
            return true;
        } else {
            throw new CertificateErrors.CertificateTooManyPersisted(
                events[0].internalCertificateId,
                Math.abs(toPersistCounter)
            );
        }
    }
}

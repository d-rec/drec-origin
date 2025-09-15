/** @NOTE [CRITICAL ERROR] means bug in our application */

export namespace CertificateErrors {
    export namespace Issuance {
        export class CertificateAlreadyIssued extends Error {
            constructor(internalCertificateId: number) {
                super(
                    `[CRITICAL ERROR] Issuance for internalCertificateId: ${internalCertificateId} failed. Certificate already issued.`
                );
            }
        }
    }

    export namespace Transfer {
        export class FromZeroAddress extends Error {
            constructor(internalCertificateId: number) {
                super(
                    `Transfer for internalCertificateId: ${internalCertificateId} failed. Transfer is from zero address(0x0).`
                );
            }
        }

        export class ToZeroAddress extends Error {
            constructor(internalCertificateId: number) {
                super(
                    `Transfer for internalCertificateId: ${internalCertificateId} failed. Transfer is to zero address(0x0).`
                );
            }
        }

        export class NotEnoughBalance extends Error {
            constructor(internalCertificateId, address) {
                super(
                    `Transfer for: ${internalCertificateId} failed. Address: ${address} has not enough balance.`
                );
            }
        }
    }

    export namespace Claim {
        export class ForZeroAddress extends Error {
            constructor(internalCertificateId: number) {
                super(
                    `Claim for internalCertificateId: ${internalCertificateId} failed. Transfer is for zero address(0x0).`
                );
            }
        }

        export class NotEnoughBalance extends Error {
            constructor(internalCertificateId, address) {
                super(
                    `Claim for: ${internalCertificateId} failed. Address: ${address} has not enough balance.`
                );
            }
        }
    }

    export class BatchError extends Error {
        constructor(originError: Error) {
            super(`Batch operation failed. Failing operation message: ${originError.message}`);
        }
    }

    export class UnknownEventType extends Error {
        constructor(internalCertificateId: number, eventType: string) {
            super(
                `[CRITICAL ERROR] Unknown event type ${eventType} for certificate ${internalCertificateId}.`
            );
        }
    }

    export class FirstCertificateEventIsNotIssuance extends Error {
        constructor(internalCertificateId: number, type: string) {
            super(
                `[CRITICAL ERROR] First event for certificate: ${internalCertificateId} is not issuance but ${type}.`
            );
        }
    }

    export class CertificateNoEvents extends Error {
        constructor() {
            super(`[CRITICAL ERROR] Tried to create certificate without events.`);
        }
    }

    export class CertificateTooManyPersisted extends Error {
        constructor(internalCertificateId: number, toPersistCounter: number) {
            super(
                `[CRITICAL ERROR] Certificate ${internalCertificateId} has too many (${toPersistCounter}) persisted events.`
            );
        }
    }
}

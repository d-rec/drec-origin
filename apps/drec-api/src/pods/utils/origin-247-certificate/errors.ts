/** @NOTE [CRITICAL ERROR] means bug in our application */

// Issuance Errors
export class CertificateAlreadyIssued extends Error {
  constructor(internalCertificateId: number) {
    super(
      `[CRITICAL ERROR] Issuance for internalCertificateId: ${internalCertificateId} failed. Certificate already issued.`,
    );
  }
}

// Transfer Errors
export class TransferFromZeroAddress extends Error {
  constructor(internalCertificateId: number) {
    super(
      `Transfer for internalCertificateId: ${internalCertificateId} failed. Transfer is from zero address(0x0).`,
    );
  }
}

export class TransferToZeroAddress extends Error {
  constructor(internalCertificateId: number) {
    super(
      `Transfer for internalCertificateId: ${internalCertificateId} failed. Transfer is to zero address(0x0).`,
    );
  }
}

export class TransferNotEnoughBalance extends Error {
  constructor(internalCertificateId: number, address: string) {
    super(
      `Transfer for: ${internalCertificateId} failed. Address: ${address} has not enough balance.`,
    );
  }
}

// Claim Errors
export class ClaimForZeroAddress extends Error {
  constructor(internalCertificateId: number) {
    super(
      `Claim for internalCertificateId: ${internalCertificateId} failed. Transfer is for zero address(0x0).`,
    );
  }
}

export class ClaimNotEnoughBalance extends Error {
  constructor(internalCertificateId: number, address: string) {
    super(
      `Claim for: ${internalCertificateId} failed. Address: ${address} has not enough balance.`,
    );
  }
}

// General Errors
export class BatchError extends Error {
  constructor(originError: Error) {
    super(
      `Batch operation failed. Failing operation message: ${originError.message}`,
    );
  }
}

export class UnknownEventType extends Error {
  constructor(internalCertificateId: number, eventType: string) {
    super(
      `[CRITICAL ERROR] Unknown event type ${eventType} for certificate ${internalCertificateId}.`,
    );
  }
}

export class FirstCertificateEventIsNotIssuance extends Error {
  constructor(internalCertificateId: number, type: string) {
    super(
      `[CRITICAL ERROR] First event for certificate: ${internalCertificateId} is not issuance but ${type}.`,
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
      `[CRITICAL ERROR] Certificate ${internalCertificateId} has too many (${toPersistCounter}) persisted events.`,
    );
  }
}

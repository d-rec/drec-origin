import { ICertificateEvent } from '../../../events/certificate.events';
import { EntityManager } from 'typeorm';
import { CertificateSynchronizationAttemptEntity } from './certificate-synchronization-attempt.entity';

export interface IGetToProcessOptions {
  limit: number | null;
}

export type UnsavedEvent = Omit<ICertificateEvent, 'id'>;

export interface CertificateEventRepository {
  save(
    event: UnsavedEvent,
    commandId: number,
    txManager: EntityManager | null,
  ): Promise<ICertificateEvent>;

  saveMany(
    events: (UnsavedEvent & { commandId: number })[],
    txManager: EntityManager | null,
  ): Promise<ICertificateEvent[]>;

  createSynchronizationAttempt(
    eventId: number,
    txManager: EntityManager | null,
  ): Promise<CertificateSynchronizationAttemptEntity>;

  createSynchronizationAttempts(
    eventId: number[],
    txManager: EntityManager | null,
  ): Promise<CertificateSynchronizationAttemptEntity[]>;

  getByInternalCertificateId(
    internalCertId: number,
  ): Promise<ICertificateEvent[]>;

  /**
   * @NOTE not found blockchain ids will not be included in the map
   */
  getBlockchainIdMap(
    internalCertIds: number[],
  ): Promise<Record<number, number>>;

  updateAttempt(updateData: {
    eventIds: number[];
    error?: string;
  }): Promise<CertificateSynchronizationAttemptEntity[]>;

  getAll(): Promise<ICertificateEvent[]>;

  getNextInternalCertificateId(): Promise<number>;

  findAllToProcess(options: IGetToProcessOptions): Promise<ICertificateEvent[]>;
}

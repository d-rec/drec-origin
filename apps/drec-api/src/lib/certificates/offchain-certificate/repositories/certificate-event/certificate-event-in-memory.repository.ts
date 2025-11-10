import { Injectable, NotFoundException } from '@nestjs/common';
import { chain } from 'lodash';
import { CertificateEventEntity } from './certificate-event.entity';
import { CertificateSynchronizationAttemptEntity } from './certificate-synchronization-attempt.entity';
import {
  CertificateEventRepository,
  UnsavedEvent,
} from './certificate-event.repository';
import {
  CertificateIssuancePersistedEvent,
  isIssuePersistedEvent,
} from '../../../events/certificate.events';
import { arrayToMap } from '../../../types/array';

@Injectable()
export class CertificateEventInMemoryRepository
  implements CertificateEventRepository
{
  private internalCertificateIdSerial: number = 0;
  private eventDb: CertificateEventEntity[] = [];
  private attemptDb: Record<string, CertificateSynchronizationAttemptEntity> =
    {};
  private maxSynchronizationAttemptsForEvent: number = Infinity;

  public async getAll(): Promise<CertificateEventEntity[]> {
    return this.eventDb;
  }

  public async getByInternalCertificateId(
    internalCertId: number,
  ): Promise<CertificateEventEntity[]> {
    return this.eventDb.filter(
      (e) => e.internalCertificateId === internalCertId,
    );
  }

  public async save(
    event: UnsavedEvent,
    commandId: number,
  ): Promise<CertificateEventEntity> {
    const entity = {
      internalCertificateId: event.internalCertificateId,
      type: event.type,
      version: event.version,
      payload: event.payload,
      createdAt: event.createdAt,
      commandId: commandId,
      id: this.eventDb.length + 1,
    };

    this.eventDb.push(entity);

    return entity;
  }

  public async saveMany(
    events: (UnsavedEvent & { commandId: number })[],
  ): Promise<CertificateEventEntity[]> {
    const saved: CertificateEventEntity[] = [];

    events.forEach((event) => {
      const entity = {
        internalCertificateId: event.internalCertificateId,
        type: event.type,
        version: event.version,
        payload: event.payload,
        createdAt: event.createdAt,
        commandId: event.commandId,
        id: this.eventDb.length + 1,
      };
      this.eventDb.push(entity);
      saved.push(entity);
    });

    return saved;
  }

  public async createSynchronizationAttempt(
    eventId: number,
  ): Promise<CertificateSynchronizationAttemptEntity> {
    const entity = {
      eventId,
      attemptsCount: 0,
      createdAt: new Date(),
    };

    this.attemptDb[eventId] = entity;

    return entity;
  }

  public async createSynchronizationAttempts(
    eventIds: number[],
  ): Promise<CertificateSynchronizationAttemptEntity[]> {
    const savedEntities: CertificateSynchronizationAttemptEntity[] = [];

    eventIds.forEach((eventId) => {
      const entity = {
        eventId,
        attemptsCount: 0,
        createdAt: new Date(),
      };

      this.attemptDb[eventId] = entity;
      savedEntities.push(entity);
    });

    return savedEntities;
  }

  public async updateAttempt({
    eventIds,
    error,
  }): Promise<CertificateSynchronizationAttemptEntity[]> {
    const savedAttempts: CertificateSynchronizationAttemptEntity[] = [];

    eventIds.forEach((eventId) => {
      const synchronizationAttempt = this.attemptDb[eventId];

      if (!synchronizationAttempt) {
        throw new Error('Synchronization attempt does not exist');
      }

      synchronizationAttempt.attemptsCount =
        synchronizationAttempt.attemptsCount + 1;
      synchronizationAttempt.error = error ?? null;
      savedAttempts.push(synchronizationAttempt);
    });

    return savedAttempts;
  }

  public async findAllToProcess(): Promise<CertificateEventEntity[]> {
    const failedEventIds = Object.values(this.attemptDb)
      .filter(
        (a) =>
          a.error && a.attemptsCount > this.maxSynchronizationAttemptsForEvent,
      )
      .map((a) => a.eventId);
    const failedCerts = chain(this.eventDb)
      .filter((e) => failedEventIds.includes(e.id))
      .map((e) => e.internalCertificateId)
      .compact()
      .uniq()
      .value();

    const attempts = Object.values(this.attemptDb).filter((a) => {
      return (
        (!a.error && a.attemptsCount === 0) ||
        (a.error && a.attemptsCount < this.maxSynchronizationAttemptsForEvent)
      );
    });

    const events = chain(attempts)
      .map((a) => this.eventDb.find((e) => e.id === a.eventId))
      .compact()
      .filter((e) => !failedCerts.includes(e.internalCertificateId))
      .value();

    return events;
  }

  public async getOne(eventId: number): Promise<CertificateEventEntity> {
    const event = this.eventDb.find((e) => e.id === eventId);

    if (!event) {
      throw new NotFoundException();
    }

    return event;
  }

  public async getBlockchainIdMap(
    internalCertIds: number[],
  ): Promise<Record<number, number>> {
    // This guard in filter should work (properly map type), but whatever reason it keeps original type
    const issuanceEvents = this.eventDb.filter(
      isIssuePersistedEvent,
    ) as any as CertificateIssuancePersistedEvent[];
    const events = issuanceEvents.filter((e) =>
      internalCertIds.includes(e.internalCertificateId),
    );

    const idMap = arrayToMap(
      events,
      (e) => e.internalCertificateId,
      (e) => e.payload.blockchainCertificateId,
    );

    return idMap;
  }

  public async getNextInternalCertificateId(): Promise<number> {
    this.internalCertificateIdSerial += 1;

    return this.internalCertificateIdSerial;
  }
}

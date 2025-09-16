import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { CertificateEventEntity } from './certificate-event.entity';
import { CertificateEventType, CertificateIssuancePersistedEvent, ICertificateEvent } from '../../../../../../events/certificate.events';
import { CertificateSynchronizationAttemptEntity } from './certificate-synchronization-attempt.entity';
import { CertificateEventRepository, IGetToProcessOptions } from './certificate-event.repository';
import { arrayToMap } from '../../../../../../types/utils/array';
import { getConfiguration } from '../../config/configuration';

@Injectable()
export class CertificateEventPostgresRepository implements CertificateEventRepository {
    private readonly maxSynchronizationAttemptsForEvent: number;

    constructor(
        @InjectRepository(CertificateEventEntity)
        private repository: Repository<CertificateEventEntity>,
        @InjectRepository(CertificateSynchronizationAttemptEntity)
        private synchronizationAttemptRepository: Repository<CertificateSynchronizationAttemptEntity>
    ) {
        this.maxSynchronizationAttemptsForEvent = getConfiguration().MAX_SYNCHRONIZATION_ATTEMPTS_FOR_EVENT;
    }

    public async getAll(): Promise<CertificateEventEntity[]> {
        return await this.repository.find();
    }

    public async getByInternalCertificateId(
        internalCertId: number
    ): Promise<CertificateEventEntity[]> {
        return await this.repository.find({
            where: {
                internalCertificateId: internalCertId
            }
        });
    }

    public async save(
        event: Omit<ICertificateEvent, 'id'>,
        commandId: number,
        txManager: EntityManager | null
    ): Promise<CertificateEventEntity> {
        const repository = txManager
            ? txManager.getRepository(CertificateEventEntity)
            : this.repository;

        return await repository.save({
            internalCertificateId: event.internalCertificateId,
            type: event.type,
            version: event.version,
            payload: event.payload,
            createdAt: event.createdAt,
            commandId: commandId
        });
    }

    public async saveMany(
        events: (Omit<ICertificateEvent, 'id'> & { commandId: number })[],
        txManager: EntityManager | null
    ): Promise<CertificateEventEntity[]> {
        const repository = txManager
            ? txManager.getRepository(CertificateEventEntity)
            : this.repository;

        const eventsToSave = events.map((event) => ({
            internalCertificateId: event.internalCertificateId,
            type: event.type,
            version: event.version,
            payload: event.payload,
            createdAt: event.createdAt,
            commandId: event.commandId
        }));

        return await repository.save(eventsToSave);
    }

    public async createSynchronizationAttempt(
        eventId: number,
        txManager: EntityManager | null
    ): Promise<CertificateSynchronizationAttemptEntity> {
        const repository = txManager
            ? txManager.getRepository(CertificateSynchronizationAttemptEntity)
            : this.synchronizationAttemptRepository;

        return await repository.save({
            eventId,
            attemptsCount: 0
        });
    }

    public async createSynchronizationAttempts(
        eventIds: number[],
        txManager: EntityManager | null
    ): Promise<CertificateSynchronizationAttemptEntity[]> {
        const repository = txManager
            ? txManager.getRepository(CertificateSynchronizationAttemptEntity)
            : this.synchronizationAttemptRepository;

        return await repository.save(
            eventIds.map((eventId) => ({
                eventId,
                attemptsCount: 0
            }))
        );
    }

    public async updateAttempt({
        eventIds,
        error
    }): Promise<CertificateSynchronizationAttemptEntity[]> {
        const synchronizationAttempts = await this.synchronizationAttemptRepository.findByIds(
            eventIds
        );

        return await this.synchronizationAttemptRepository.save(
            synchronizationAttempts.map((attempt) => ({
                ...attempt,
                attemptsCount: attempt.attemptsCount + 1,
                error: error ?? null
            }))
        );
    }

    public async findAllToProcess(params: IGetToProcessOptions): Promise<CertificateEventEntity[]> {
        const failedCertificatesIds = this.repository
            .createQueryBuilder('event')
            .select(['event.internalCertificateId'])
            .innerJoin(
                CertificateSynchronizationAttemptEntity,
                'attempt',
                'attempt.eventId = event.id'
            )
            .where(`(attempt.attempts_count >= :attempts)`, {
                attempts: this.maxSynchronizationAttemptsForEvent
            });

        const query = this.repository
            .createQueryBuilder('event')
            .select([
                'event.id',
                'event.internalCertificateId',
                'event.createdAt',
                'event.type',
                'event.version',
                'event.payload'
            ])
            .innerJoinAndSelect(
                CertificateSynchronizationAttemptEntity,
                'attempt',
                'attempt.eventId = event.id'
            )
            .where(
                `
                (
                    (attempt.attempts_count = 0) 
                    OR 
                    (attempt.error IS NOT NULL AND attempt.attempts_count < :attempts)
                )`,
                { attempts: this.maxSynchronizationAttemptsForEvent }
            )
            .andWhere(`event.internalCertificateId NOT IN (${failedCertificatesIds.getQuery()})`)
            .orderBy('event."createdAt"');

        if (params.limit) {
            return await query.limit(params.limit).getMany();
        } else {
            return await query.getMany();
        }
    }

    public async getOne(eventId: number): Promise<CertificateEventEntity> {
        const event = await this.repository.findOne(eventId);

        if (!event) {
            throw new NotFoundException();
        }

        return event;
    }

    public async getBlockchainIdMap(internalCertIds: number[]): Promise<Record<number, number>> {
        if (internalCertIds.length === 0) {
            return [];
        }

        const events = ((await this.repository.find({
            where: {
                type: CertificateEventType.IssuancePersisted,
                internalCertificateId: In(internalCertIds)
            }
        })) as any) as CertificateIssuancePersistedEvent[]; // because of missing `_id` which is not relevant here

        return arrayToMap(
            events,
            (e) => e.internalCertificateId,
            (e) => e.payload.blockchainCertificateId
        );
    }

    public async getNextInternalCertificateId(): Promise<number> {
        const [{ nextval }] = await this.repository.query(
            `SELECT nextval('certificate_internal_certificate_id_seq')`
        );

        return Number(nextval);
    }
}

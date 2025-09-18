import { Inject, Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import {
  ICertificateEvent,
  ICertificateReadModel,
  IClaimPersistedCommand,
  IIssuancePersistedCommand,
  IPersistErrorCommand,
  ITransferPersistedCommand,
} from '../../../../types/utils/certificates';
import { CertificateCommandEntity } from './repositories/certificate-command/certificate-command.entity';
import {
  CertificateClaimedEvent,
  CertificateClaimPersistedEvent,
  CertificateIssuancePersistedEvent,
  CertificateIssuedEvent,
  CertificatePersistErrorEvent,
  CertificateTransferPersistedEvent,
  CertificateTransferredEvent,
  isPersistedEvent,
  PersistedEvent,
} from '../../../../events/certificate.events';
import { CertificateAggregate } from '../certificate.aggregate';
import {
  IClaimCommand,
  IIssueCommand,
  IIssueCommandParams,
  ITransferCommand,
} from '../../../../types/utils/issuer';
import {
  CERTIFICATE_COMMAND_REPOSITORY,
  CERTIFICATE_EVENT_REPOSITORY,
  CERTIFICATE_READ_MODEL_REPOSITORY,
} from '../repository.keys';
import { CertificateCommandRepository } from './repositories/certificate-command/certificate-command.repository';
import {
  createAggregatesFromCertificateGroups,
  createEventFromCommand,
  createIssueEventsFromCommands,
  groupByInternalCertificateId,
  zipEventsWithCommandId,
} from '../../../../utils/batch';
import {
  validateBatchIssueCommands,
  validateIssueCommand,
} from './validators/issue-command.validator';
import {
  validateBatchClaimCommands,
  validateClaimCommand,
} from './validators/claim-command.validator';
import {
  validateBatchTransferCommands,
  validateTransferCommand,
} from './validators/transfer-command.validator';
import {
  CertificateEventRepository,
  UnsavedEvent,
} from './repositories/certificate-event/certificate-event.repository';
import { CertificateEventService } from './repositories/certificate-event/certificate-event.service';
import {
  CertificateReadModelRepository,
  IGetAllCertificatesOptions,
} from './repositories/certificate-read-modal/certificate-read-model-postgres.repository';
import { BatchError } from '../errors';

@Injectable()
export class OffChainCertificateService<T = null> {
  constructor(
    @Inject(CERTIFICATE_COMMAND_REPOSITORY)
    private readonly certCommandRepo: CertificateCommandRepository,
    @Inject(CERTIFICATE_EVENT_REPOSITORY)
    private readonly certEventRepo: CertificateEventRepository,
    private readonly certificateEventService: CertificateEventService,
    private readonly eventBus: EventBus,
    @Inject(CERTIFICATE_READ_MODEL_REPOSITORY)
    private readonly readModelRepo: CertificateReadModelRepository<T>,
  ) {}

  public async getAll(
    options: IGetAllCertificatesOptions = {},
  ): Promise<ICertificateReadModel<T>[]> {
    return await this.readModelRepo.getAll(options);
  }

  public async getById(id: number): Promise<ICertificateReadModel<T> | null> {
    return await this.readModelRepo.getByInternalCertificateId(id);
  }

  public async getByIds(ids: number[]): Promise<ICertificateReadModel<T>[]> {
    return await this.readModelRepo.getManyByInternalCertificateIds(ids);
  }

  public async issue(params: IIssueCommandParams<T>): Promise<number> {
    const command = {
      ...params,
      fromTime: Math.round(params.fromTime.getTime() / 1000),
      toTime: Math.round(params.toTime.getTime() / 1000),
    } as IIssueCommand<T>;
    await validateIssueCommand(command);

    return await this.issueWithoutValidation(command);
  }

  public async issueWithoutValidation(
    command: IIssueCommand<T>,
  ): Promise<number> {
    const savedCommand = await this.certCommandRepo.save({ payload: command });

    const event = CertificateIssuedEvent.createNew(
      await this.generateInternalCertificateId(),
      command,
    );

    const aggregate = await this.createAggregate([event]);

    await this.propagate(event, savedCommand, aggregate);

    return event.internalCertificateId;
  }

  public async claim(command: IClaimCommand): Promise<void> {
    await validateClaimCommand(command);
    return await this.claimWithoutValidation(command);
  }

  public async claimWithoutValidation(command: IClaimCommand): Promise<void> {
    const savedCommand = await this.certCommandRepo.save({ payload: command });
    const event = CertificateClaimedEvent.createNew(
      command.certificateId,
      command,
    );
    const aggregate = await this.createAggregate([event]);
    await this.propagate(event, savedCommand, aggregate);
  }

  public async transfer(command: ITransferCommand): Promise<void> {
    await validateTransferCommand(command);
    return await this.transferWithoutValidation(command);
  }

  public async transferWithoutValidation(
    command: ITransferCommand,
  ): Promise<void> {
    const savedCommand = await this.certCommandRepo.save({ payload: command });
    const event = CertificateTransferredEvent.createNew(
      command.certificateId,
      command,
    );
    const aggregate = await this.createAggregate([event]);
    await this.propagate(event, savedCommand, aggregate);
  }

  public async issuePersisted(
    internalCertificateId: number,
    command: IIssuancePersistedCommand,
  ): Promise<void> {
    const savedCommand = await this.certCommandRepo.save({ payload: command });

    const event = CertificateIssuancePersistedEvent.createNew(
      internalCertificateId,
      command,
    );

    const aggregate = await this.createAggregate([event]);
    await this.propagate(event, savedCommand, aggregate);
  }

  public async claimPersisted(
    internalCertificateId: number,
    command: IClaimPersistedCommand,
  ): Promise<void> {
    const savedCommand = await this.certCommandRepo.save({ payload: command });

    const event = CertificateClaimPersistedEvent.createNew(
      internalCertificateId,
      command,
    );

    const aggregate = await this.createAggregate([event]);
    await this.propagate(event, savedCommand, aggregate);
  }

  public async transferPersisted(
    internalCertificateId: number,
    command: ITransferPersistedCommand,
  ): Promise<void> {
    const savedCommand = await this.certCommandRepo.save({ payload: command });

    const event = CertificateTransferPersistedEvent.createNew(
      internalCertificateId,
      command,
    );

    const aggregate = await this.createAggregate([event]);
    await this.propagate(event, savedCommand, aggregate);
  }

  public async persistError(
    internalCertificateId: number,
    command: IPersistErrorCommand,
  ): Promise<void> {
    const savedCommand = await this.certCommandRepo.save({ payload: command });

    const event = CertificatePersistErrorEvent.createNew(
      internalCertificateId,
      command,
    );

    const aggregate = await this.createAggregate([event]);
    await this.propagate(event, savedCommand, aggregate, command.errorMessage);
  }

  public async batchIssue(
    originalCertificates: IIssueCommandParams<T>[],
  ): Promise<number[]> {
    if (!originalCertificates.length) {
      return [];
    }

    const commands: IIssueCommand<T>[] = originalCertificates.map((c) => ({
      ...c,
      fromTime: Math.round(c.fromTime.getTime() / 1000),
      toTime: Math.round(c.toTime.getTime() / 1000),
    }));

    await validateBatchIssueCommands(commands);
    await this.validateBatchIssue(commands);

    const savedCommands = await this.certCommandRepo.saveMany(
      commands.map((command) => ({ payload: command })),
    );

    const events = await createIssueEventsFromCommands(commands, () =>
      this.generateInternalCertificateId(),
    );
    const eventsByCertificateId = groupByInternalCertificateId(events);

    const aggregates = await createAggregatesFromCertificateGroups(
      eventsByCertificateId,
      (events) => this.createAggregate(events),
    );

    await this.propagateMany(
      zipEventsWithCommandId(events, savedCommands),
      aggregates,
    );

    return events.map((event) => event.internalCertificateId);
  }

  public async batchClaim(commands: IClaimCommand[]): Promise<void> {
    if (!commands.length) {
      return;
    }
    await validateBatchClaimCommands(commands);
    await this.handleBatch(commands, (commands) =>
      this.validateBatchClaim(commands),
    );
  }

  public async batchTransfer(commands: ITransferCommand[]): Promise<void> {
    if (!commands.length) {
      return;
    }

    await validateBatchTransferCommands(commands);
    await this.handleBatch(commands, (commands) =>
      this.validateBatchTransfer(commands),
    );
  }

  private async handleBatch<
    CommandType extends IClaimCommand | ITransferCommand,
  >(
    commands: CommandType[],
    commandValidator: (commands: CommandType[]) => Promise<void>,
  ) {
    const savedCommands = await this.certCommandRepo.saveMany(
      commands.map((command) => ({ payload: command })),
    );

    await commandValidator(commands);
    const events = commands.map((command) => createEventFromCommand(command));

    const eventsByCertificate = groupByInternalCertificateId(events);

    const aggregates = await createAggregatesFromCertificateGroups(
      eventsByCertificate,
      (events) => this.createAggregate(events),
    );

    await this.propagateMany(
      zipEventsWithCommandId(events, savedCommands),
      aggregates,
    );
  }

  private async validateBatchIssue(
    commands: IIssueCommand<T>[],
  ): Promise<void> {
    try {
      commands.forEach((c) => {
        CertificateAggregate.fromEvents([
          CertificateIssuedEvent.createNew(-1, c),
        ]);
      });
    } catch (err) {
      throw new BatchError(err);
    }
  }

  private async validateBatchClaim(commands: IClaimCommand[]): Promise<void> {
    const events = commands.map((command) => createEventFromCommand(command));
    const eventsByCertificateId = groupByInternalCertificateId(events);

    try {
      await createAggregatesFromCertificateGroups(
        eventsByCertificateId,
        (events) => this.createAggregate(events),
      );
    } catch (err) {
      throw new BatchError(err);
    }
  }

  private async validateBatchTransfer(
    commands: ITransferCommand[],
  ): Promise<void> {
    const events = commands.map((command) => createEventFromCommand(command));
    const eventsByCertificateId = groupByInternalCertificateId(events);

    try {
      await createAggregatesFromCertificateGroups(
        eventsByCertificateId,
        (events) => this.createAggregate(events),
      );
    } catch (err) {
      throw new BatchError(err);
    }
  }

  private async createAggregate(
    newEvents: ICertificateEvent[],
  ): Promise<CertificateAggregate<T>> {
    const certificateId = newEvents[0].internalCertificateId;

    const previousEvents =
      await this.certEventRepo.getByInternalCertificateId(certificateId);

    return CertificateAggregate.fromEvents<T>([
      ...previousEvents,
      ...newEvents,
    ]);
  }

  private async generateInternalCertificateId(): Promise<number> {
    return await this.certEventRepo.getNextInternalCertificateId();
  }

  private async propagate(
    event: ICertificateEvent,
    command: CertificateCommandEntity,
    aggregate: CertificateAggregate<T>,
    errorMessage?: string,
  ): Promise<void> {
    await this.eventBus.publish(event);
    await this.readModelRepo.save(aggregate.getCertificate()!);
    const savedEvent = await this.certificateEventService.save(
      event,
      command.id,
    );

    if (isPersistedEvent(savedEvent)) {
      await this.certEventRepo.updateAttempt({
        eventIds: [savedEvent.payload.persistedEventId],
        error: errorMessage,
      });
    }
  }

  private async propagateMany(
    events: (UnsavedEvent & { commandId: number })[],
    aggregates: CertificateAggregate<T>[],
    errorMessage?: string,
  ): Promise<void> {
    await this.eventBus.publishAll(events);
    await this.readModelRepo.saveMany(
      aggregates.map((aggregate) => aggregate.getCertificate()),
    );
    const savedEvents = await this.certificateEventService.saveMany(events);
    const persistedEvents = savedEvents.filter((event) =>
      isPersistedEvent(event),
    ) as PersistedEvent[];

    await this.certEventRepo.updateAttempt({
      eventIds: persistedEvents.map((event) => event.payload.persistedEventId),
      error: errorMessage,
    });
  }
}

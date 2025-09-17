import { groupBy } from 'lodash';
import { CertificateAggregate } from '../pods/utils/origin-247-certificate/certificate.aggregate';
import {
  CertificateClaimedEvent,
  CertificateIssuedEvent,
  CertificateTransferredEvent,
  ICertificateEvent,
} from '../events/certificate.events';
import {
  IClaimCommand,
  IIssueCommand,
  ITransferCommand,
} from '../types/utils/issuer';

export const groupByInternalCertificateId = <
  T extends { internalCertificateId: number },
>(
  entityWithCertificateId: T[],
): Record<number, T[]> =>
  groupBy(entityWithCertificateId, 'internalCertificateId');

export const createAggregatesFromCertificateGroups = async <T>(
  certificateEventsGroups: Record<number, ICertificateEvent[]>,
  createAggregateFunction: (
    events: ICertificateEvent[],
  ) => Promise<CertificateAggregate<T>>,
) =>
  await Promise.all(
    Object.values(certificateEventsGroups).map(
      async (eventsForCertificate) =>
        await createAggregateFunction(eventsForCertificate),
    ),
  );

export const createEventFromCommand = (
  command: IClaimCommand | ITransferCommand,
) => {
  if (isTransferCommand(command)) {
    return CertificateTransferredEvent.createNew(
      command.certificateId,
      command,
    );
  }
  return CertificateClaimedEvent.createNew(command.certificateId, command);
};

export const createIssueEventsFromCommands = async <T>(
  commands: IIssueCommand<T>[],
  getIdFunction: () => Promise<number>,
) =>
  await Promise.all(
    commands.map(async (command) =>
      CertificateIssuedEvent.createNew(await getIdFunction(), command),
    ),
  );
export const isTransferCommand = (
  command: IClaimCommand | ITransferCommand,
): command is ITransferCommand => {
  return (command as any).fromAddress && (command as any).toAddress;
};

export const zipEventsWithCommandId = (
  events: ICertificateEvent[],
  commands: { id: number }[],
) =>
  events.map((event, index) => ({ ...event, commandId: commands[index].id }));

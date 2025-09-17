import { flatten, groupBy } from 'lodash';
import { ICertificateEvent } from '../../../../../../../events/certificate.events';

type CertificateId = number;

export class EventsBatchQueue {
  private eventsToProcess: Record<CertificateId, ICertificateEvent[]> = {};

  constructor(events: ICertificateEvent[]) {
    const sortedEvents = events.sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );

    this.eventsToProcess = groupBy(sortedEvents, 'internalCertificateId');
  }

  public popBatch(): ICertificateEvent[] {
    const eventsToProcess: ICertificateEvent[] = [];

    Object.entries(this.eventsToProcess).forEach(
      ([certificateId, eventsForCertificate]) => {
        const [firstEvent, ...otherEvents] = eventsForCertificate;
        if (firstEvent) {
          this.eventsToProcess[certificateId] = otherEvents;
          eventsToProcess.push(firstEvent);
        } else {
          this.removeEventsForCertificateIds([Number(certificateId)]);
        }
      },
    );

    return eventsToProcess;
  }

  public isEmpty(): boolean {
    return flatten(Object.values(this.eventsToProcess)).length === 0;
  }

  public removeEventsForCertificateIds(internalCertificateIds: number[]): void {
    internalCertificateIds.forEach((internalCertificateId) => {
      delete this.eventsToProcess[internalCertificateId];
    });
  }
}

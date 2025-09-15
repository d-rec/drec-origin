import { ICertificateEvent } from "../../../../../../events/certificate.events";


export const SYNCHRONIZE_STRATEGY = Symbol.for('SYNCHRONIZE_STRATEGY');

export interface SynchronizeStrategy {
    synchronize(events: ICertificateEvent[]): Promise<void>;
}

import { BigNumber } from 'ethers';

export interface GenerationReadingStoredPayload {
  deviceId: number | string;
  fromTime: Date;
  toTime: Date;
  organizationId: string;
  energyValue: BigNumber;
}

export class GenerationReadingStoredEvent {
  constructor(public data: GenerationReadingStoredPayload) {}
}

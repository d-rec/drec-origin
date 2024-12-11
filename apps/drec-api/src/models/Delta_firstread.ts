import { Unit } from '@energyweb/energy-api-influxdb';

export interface IDeltaIntermediate {
  id: number;
  unit: Unit;
  readsvalue: number;
  readsEndDate: Date;
  createdAt: Date;
  updatedAt: Date;
  externalId?: string;
}

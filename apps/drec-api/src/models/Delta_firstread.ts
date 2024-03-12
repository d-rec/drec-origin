import { Unit } from '@energyweb/energy-api-influxdb';

export interface IDeltaintermediate {
  id: number;
  unit: Unit;
  readsvalue: number;
  readsEndDate: Date;
  createdAt: Date;
  updatedAt: Date;
  externalId?: string;
}

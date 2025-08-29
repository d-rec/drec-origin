import { Unit } from '../types/reads';

export interface IDeltaIntermediate {
  id: number;
  unit: Unit;
  readsvalue: number;
  readsEndDate: Date;
  createdAt: Date;
  updatedAt: Date;
  externalId?: string;
}

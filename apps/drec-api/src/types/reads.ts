import { ReadType } from '../utils/enums/read-type.enum';

export type ReadsFilterDTO = {
  limit: number;
  offset: number;
  start: string;
  end: string;
  order?: 'ASC' | 'DESC';
};

export type AggregatedReadDTO = {
  start: Date;
  stop: Date;
  value: number;
};

export enum Unit {
  Wh = 'Wh',
  kWh = 'kWh',
  MWh = 'MWh',
  GWh = 'GWh',
}

export class ReadDTO {
  startDate: Date;
  endDate: Date;
  value: number;
}

export class MeasurementDTO {
  reads: ReadDTO[];
  unit: Unit;
  type: ReadType;
}

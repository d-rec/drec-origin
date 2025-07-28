import { Unit } from '../../../utils/enums/unit.enum';
import { ReadType } from '../../../utils/enums/read-type.enum';

export declare class ReadDTO {
  startDate: Date;
  endDate: Date;
  value: number;
}

export declare class MeasurementDTO {
  reads: ReadDTO[];
  unit: Unit;
  type: ReadType;
}

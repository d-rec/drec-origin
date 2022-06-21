import { ExtendedBaseEntity } from '@energyweb/origin-backend-utils';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

import {
  IsEnum,
  IsBoolean,
  IsString,
  IsNotEmpty,
  IsNumber,
  IsArray,
} from 'class-validator';

@Entity('device_csv_processing_failed_rows')
export class DeviceCsvProcessingFailedRowsEntity extends ExtendedBaseEntity {
  constructor() {
    super();
  }

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @IsNumber()
  jobId: number;

  //@Column("json", { array: true })
  @Column('json')
  errorDetails: Array<any>;
}

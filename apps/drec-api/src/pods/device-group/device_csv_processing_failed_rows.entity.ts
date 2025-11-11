import { ExtendedBaseEntity } from '../../lib/backend-utils/extended-base-entity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

import { IsNumber } from 'class-validator';

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
  errorDetails: any;
}

import { ExtendedBaseEntity } from '@energyweb/origin-backend-utils';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

import { IsNumber } from 'class-validator';

@Entity('file_processing_failed_reads_logs')
export class DeviceCsvProcessingFailedRowsEntity extends ExtendedBaseEntity {
  constructor() {
    super();
  }

  @PrimaryGeneratedColumn('uuid')
  id: number;

  @Column()
  @IsNumber()
  jobId: number;

  @Column('json')
  errorDetails: any;
}

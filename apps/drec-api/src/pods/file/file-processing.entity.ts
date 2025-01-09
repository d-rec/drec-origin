import { ExtendedBaseEntity } from '@energyweb/origin-backend-utils';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

import { IsEnum, IsString, IsNumber, IsOptional } from 'class-validator';

export enum FileProcessingStatus {
  Added = 'Added',
  InProgress = 'InProgress',
  Completed = 'Completed',
  Failed = 'Failed',
}

export enum FileProcessingType {
  AddMeterRead = 'MeterRead',
  DeviceCreation = 'DeviceCreation',
}

@Entity('file_processing_jobs')
export class FileProcessingEntity extends ExtendedBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @IsString()
  fileId: string;

  @Column()
  @IsString()
  jobId: string;

  @Column()
  @IsNumber()
  userId: number;

  @Column()
  @IsNumber()
  organizationId: number;

  organization?: {
    name: string;
  };

  @Column()
  @IsEnum(FileProcessingStatus)
  status: FileProcessingStatus;

  @Column()
  @IsEnum(FileProcessingType)
  type: FileProcessingType;

  @Column({ nullable: true, default: null })
  @IsOptional()
  apiUserId: string;
}

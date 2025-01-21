import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ExtendedBaseEntity } from '@energyweb/origin-backend-utils';
import { IsEnum, IsString, IsNumber } from 'class-validator';
import { BulkUploadFailedLogEntity } from '../bulk-upload/bulk-uploads-failed-logs.entity';

export enum BulkUploadStatus {
  Added = 'Added',
  InProgress = 'InProgress',
  Completed = 'Completed',
  Failed = 'Failed',
}

export enum BulkUploadType {
  Reads = 'Reads',
  Devices = 'Devices',
}

@Entity('bulk_uploads')
export class BulkUploadEntity extends ExtendedBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'file_id' })
  @IsString()
  fileId: string;

  @Column({ name: 'job_id' })
  @IsString()
  jobId: string;

  @Column({ name: 'organization_id' })
  @IsNumber()
  organizationId: number;

  organization?: {
    name: string;
  };

  @Column({ name: 'status' })
  @IsEnum(BulkUploadStatus)
  status: BulkUploadStatus;

  @Column({ name: 'type' })
  @IsEnum(BulkUploadType)
  type: BulkUploadType;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(
    () => BulkUploadFailedLogEntity,
    (failedLog) => failedLog.bulkUploads,
  )
  failedLogs: BulkUploadFailedLogEntity[];
}

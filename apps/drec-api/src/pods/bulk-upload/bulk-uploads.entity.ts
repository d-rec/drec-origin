import { IsEnum, IsNumber, IsString } from 'class-validator';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
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
export class BulkUploadEntity extends BaseEntity {
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

  api_user_id: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(
    () => BulkUploadFailedLogEntity,
    (failedLog) => failedLog.bulkUploads,
  )
  failedLogs: BulkUploadFailedLogEntity[];
}

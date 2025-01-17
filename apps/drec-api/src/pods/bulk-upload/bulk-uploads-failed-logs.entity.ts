import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ExtendedBaseEntity } from '@energyweb/origin-backend-utils';
import { BulkUploadEntity } from './bulk-uploads.entity';

@Entity('bulk_upload_failed_logs')
export class BulkUploadFailedLogEntity extends ExtendedBaseEntity {
  constructor() {
    super();
  }

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  bulkUploadId: string;

  @Column('json')
  details: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => BulkUploadEntity, (bulkUpload) => bulkUpload.failedLogs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'bulkUploadId', referencedColumnName: 'id' })
  bulkUploads: BulkUploadEntity;
}

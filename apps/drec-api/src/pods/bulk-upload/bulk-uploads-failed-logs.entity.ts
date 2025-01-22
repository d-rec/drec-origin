import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BulkUploadEntity } from './bulk-uploads.entity';

@Entity('bulk_upload_failed_logs')
export class BulkUploadFailedLogEntity extends BaseEntity  {
  constructor() {
    super();
  }

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'bulk_upload_id' })
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
  @JoinColumn({ name: 'bulk_upload_id', referencedColumnName: 'id' })
  bulkUploads: BulkUploadEntity;
}

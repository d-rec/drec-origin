import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum UploadChannel {
  Portal = 'portal',
  Api = 'api',
}

export enum UploadActionType {
  DocumentUpload = 'document_upload',
  MeterReadUpload = 'meter_read_upload',
  MeterReadApi = 'meter_read_api',
}

@Entity({ name: 'upload_log' })
export class UploadLogEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'device_id', nullable: true })
  @Index()
  deviceId: number | null;

  @Column({ name: 'user_id' })
  @Index()
  userId: number;

  @Column({ name: 'user_email', length: 255 })
  userEmail: string;

  @Column({ name: 'organization_id', nullable: true })
  organizationId: number | null;

  @Column({ length: 20, default: UploadChannel.Portal })
  channel: UploadChannel;

  @Column({ name: 'action_type', length: 50 })
  @Index()
  actionType: UploadActionType;

  @Column({ name: 'file_name', length: 500, nullable: true })
  fileName: string | null;

  @Column({ name: 'file_size_bytes', nullable: true })
  fileSizeBytes: number | null;

  @Column({ name: 'file_hash_sha256', length: 64, nullable: true })
  fileHashSha256: string | null;

  @Column({ name: 'payload_hash_sha256', length: 64, nullable: true })
  payloadHashSha256: string | null;

  @Column({ name: 'ip_address', length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}

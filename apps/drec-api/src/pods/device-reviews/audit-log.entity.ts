import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * D-REC §3.8: Independent Data Audit Layer (IDAL).
 *
 * Immutable log of every verification action taken on a device.
 * Rows are append-only — never updated or deleted.
 */
@Entity({ name: 'audit_log' })
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'device_id' })
  @Index()
  deviceId: number;

  @Column({ name: 'action_type' })
  actionType: string;

  @Column({ type: 'text', nullable: true })
  detail: string | null;

  @Column({ name: 'performed_by' })
  performedBy: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}

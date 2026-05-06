import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * Persisted Verify Device report — one row per scan run. Reviewers save
 * a report after running the verify dialog so they can share a stable
 * URL with the registrant.
 */
@Entity({ name: 'verification_reports' })
export class VerificationReport {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'device_id' })
  @Index()
  deviceId: number;

  @Column({ name: 'created_by_email' })
  createdByEmail: string;

  @Column({ name: 'created_by_name', nullable: true })
  createdByName: string | null;

  @Column({ name: 'elapsed_ms', default: 0 })
  elapsedMs: number;

  @Column({ name: 'overall_status', nullable: true })
  overallStatus: string | null;

  /** Full per-section results — stored verbatim so we can render
   *  any future check shape without schema changes. */
  @Column({ type: 'jsonb' })
  payload: Record<string, any>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}

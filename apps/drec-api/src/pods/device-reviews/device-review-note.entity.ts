import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Per-field reviewer note. Replaces the freeform `notes` textarea
 * with a thread of field-anchored comments so registrants see
 * exactly which form value the reviewer flagged. Lives at device
 * scope so feedback persists across approve/reject cycles.
 */
@Entity('device_review_note')
export class DeviceReviewNote {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ name: 'device_id', type: 'int' })
  deviceId: number;

  /** Form-field name (e.g. 'capacity', 'address', 'pvSystemOwner') or
   *  null for general notes that don't anchor to a specific field. */
  @Column({ name: 'field_name', type: 'varchar', length: 64, nullable: true })
  fieldName: string | null;

  @Column({ name: 'body', type: 'text' })
  body: string;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 16,
    default: 'open',
  })
  status: 'open' | 'resolved';

  @Column({ name: 'created_by', type: 'varchar', length: 255 })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'resolved_by', type: 'varchar', length: 255, nullable: true })
  resolvedBy: string | null;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt: Date | null;
}

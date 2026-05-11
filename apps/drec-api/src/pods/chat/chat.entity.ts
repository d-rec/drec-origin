import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type ChatKind = 'text' | 'note' | 'system' | 'doc-ref';
export type ChatNoteStatus = 'open' | 'resolved';

@Entity({ name: 'chats' })
export class Chat {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ type: 'varchar' })
  username: string;

  @Column({ type: 'text' })
  chatEntry: string;

  @Column({ type: 'uuid', nullable: true, default: null })
  nextEntryUuid: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  /** Typed-message support — see migration 1764300000000.
   *  'text'    = plain chat bubble
   *  'note'    = reviewer feedback anchored to a form field
   *  'system'  = automated marker (resolved / status change)
   *  'doc-ref' = (reserved) attachment to a specific document
   */
  @Column({
    type: 'varchar',
    length: 16,
    default: 'text',
    name: 'kind',
  })
  kind: ChatKind;

  /** Form-field key for kind='note'; null otherwise. */
  @Column({ type: 'varchar', length: 64, nullable: true, name: 'field_name' })
  fieldName: string | null;

  /** Lifecycle state for kind='note'; null for non-notes. */
  @Column({ type: 'varchar', length: 16, nullable: true, name: 'status' })
  status: ChatNoteStatus | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'resolved_by' })
  resolvedBy: string | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'resolved_at' })
  resolvedAt: Date | null;

  /** Forward-compat slot for richer kinds (doc id, snapshot URL, etc.). */
  @Column({ type: 'jsonb', nullable: true, name: 'payload' })
  payload: Record<string, any> | null;
}

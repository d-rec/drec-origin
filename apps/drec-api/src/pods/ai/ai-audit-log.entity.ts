import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Per-call ledger of third-party AI/service API usage. One row per
 * outbound call. `provider` distinguishes Anthropic (with authoritative
 * token counts), Roboflow (call-only — no native usage telemetry), and
 * DeepL (input_tokens repurposed to hold character_count, since DeepL
 * bills by chars).
 */
@Entity({ name: 'ai_audit_log' })
export class AiAuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', default: 'anthropic' })
  provider: 'anthropic' | 'roboflow' | 'deepl';

  @Column({ type: 'text' })
  endpoint: string;

  @Column({ type: 'text' })
  model: string;

  @Column({ name: 'input_tokens', type: 'integer', default: 0 })
  inputTokens: number;

  @Column({ name: 'output_tokens', type: 'integer', default: 0 })
  outputTokens: number;

  @Column({ name: 'organization_id', type: 'integer', nullable: true })
  organizationId: number | null;

  @Column({ name: 'user_id', type: 'integer', nullable: true })
  userId: number | null;

  @Column({ name: 'device_id', type: 'integer', nullable: true })
  deviceId: number | null;

  @Column({ name: 'success', type: 'boolean', default: true })
  success: boolean;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

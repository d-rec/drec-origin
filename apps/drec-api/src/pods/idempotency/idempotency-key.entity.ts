import {
  Entity,
  PrimaryColumn,
  Column,
  Index,
  CreateDateColumn,
} from 'typeorm';

/**
 * Stores the outcome of POSTs that carry an `Idempotency-Key` header so
 * that a client safely retrying after a network failure (status 0, 502
 * from a flapping target, etc.) receives the *original* response
 * instead of triggering a duplicate side-effect.
 *
 * Scoping: (key, organizationId) — keys collide only within an org.
 * That keeps client-generated UUIDs from leaking across tenants and
 * lets us drop the org-id from the key generation contract.
 *
 * Lifecycle:
 *   first request   → row inserted with completedAt=NULL (in flight)
 *   handler returns → row updated with statusCode + responseBody
 *   replay arrives  → cached row returned
 *   replay arrives mid-flight → 409 (caller should back off + retry)
 *   24h elapses     → row evicted by IdempotencyCleanupService
 */
@Entity('idempotency_key')
@Index(['createdAt'])
export class IdempotencyKeyEntity {
  /** Client-generated UUID. We don't validate the format — anything
   *  unique within the org window is acceptable — but the UI uses
   *  crypto.randomUUID() so collisions are practically impossible. */
  @PrimaryColumn({ type: 'varchar', length: 128 })
  key: string;

  @PrimaryColumn({ type: 'int' })
  organizationId: number;

  /** The endpoint that owns this key. Same UUID against a different
   *  endpoint is treated as a separate key — we don't want a stale
   *  /device key to short-circuit a later /device-group request. */
  @Column({ type: 'varchar', length: 128 })
  endpoint: string;

  /** SHA-256 of the canonical request payload. If a replay arrives
   *  with the same key but a different body, that's a client bug —
   *  we still return the original response (idempotency wins over
   *  surprise), but log a warning so the bug is visible. */
  @Column({ type: 'varchar', length: 64 })
  requestHash: string;

  @Column({ type: 'int', nullable: true })
  statusCode: number | null;

  @Column({ type: 'jsonb', nullable: true })
  responseBody: unknown | null;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

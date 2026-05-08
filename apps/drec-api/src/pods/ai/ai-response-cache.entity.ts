import { Column, Entity, PrimaryColumn, CreateDateColumn } from 'typeorm';

/**
 * Cache for AI extraction responses keyed on (content hash, endpoint).
 * Hit returns the previously-stored response without a token-spending
 * call to Anthropic. Frontend computes SHA-256 of the file bytes;
 * collisions are vanishingly improbable. TTL is enforced at lookup
 * time (7 days). On schema migration the table starts empty so
 * worst case is one re-extraction per file.
 */
@Entity({ name: 'ai_response_cache' })
export class AiResponseCache {
  @PrimaryColumn({ name: 'content_hash', type: 'varchar', length: 64 })
  contentHash: string;

  @PrimaryColumn({ name: 'endpoint', type: 'varchar', length: 64 })
  endpoint: string;

  @Column({ name: 'response', type: 'jsonb' })
  response: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

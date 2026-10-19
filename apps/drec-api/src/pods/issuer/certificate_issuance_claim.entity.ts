import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * One row per (device group, generation period) that issuance has begun.
 *
 * Inserted before the mint, so the unique index rejects a second concurrent
 * attempt at the same period instead of letting both reach the chain. See the
 * 1785000000000-CreateCertificateIssuanceClaim migration for why this lives in
 * its own table rather than as a constraint on the certificate log.
 */
@Entity({ name: 'certificate_issuance_claim' })
@Index(
  'IDX_certificate_issuance_claim_period',
  ['groupId', 'generationStart', 'generationEnd'],
  { unique: true },
)
export class CertificateIssuanceClaim {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  groupId: number;

  @Column({ name: 'generation_start', type: 'timestamptz' })
  generationStart: Date;

  @Column({ name: 'generation_end', type: 'timestamptz' })
  generationEnd: Date;

  /** Ties the claim back to the certificate it authorised, for forensics. */
  @Column({
    name: 'certificate_transaction_uid',
    type: 'varchar',
    nullable: true,
  })
  certificateTransactionUID: string | null;

  @Column({ name: 'claimed_at', type: 'timestamptz', default: () => 'now()' })
  claimedAt: Date;
}

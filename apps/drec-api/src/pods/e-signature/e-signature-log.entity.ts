import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'e_signature_log' })
export class ESignatureLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  @Index()
  userId: number;

  @Column({ name: 'user_email', length: 255 })
  userEmail: string;

  @Column({ name: 'organization_id', nullable: true })
  organizationId: number | null;

  /** e.g. 'device_registration_consent', 'terms_acceptance' */
  @Column({ length: 50 })
  action: string;

  /** The exact legal text the user agreed to */
  @Column({ name: 'consent_text', type: 'text' })
  consentText: string;

  @Column({ name: 'consent_version', length: 20, default: '1.0' })
  consentVersion: string;

  /** SHA-256 of the submitted payload (device JSON, document bundle, etc.) */
  @Column({ name: 'document_hash', length: 64, nullable: true })
  documentHash: string | null;

  @Column({ name: 'device_id', nullable: true })
  @Index()
  deviceId: number | null;

  @Column({ name: 'device_external_id', length: 255, nullable: true })
  deviceExternalId: string | null;

  @Column({ name: 'ip_address', length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null;

  @Column({ name: 'browser_fingerprint', length: 64, nullable: true })
  browserFingerprint: string | null;

  @Column({ name: 'screen_resolution', length: 20, nullable: true })
  screenResolution: string | null;

  @Column({ length: 60, nullable: true })
  timezone: string | null;

  @Column({ length: 10, nullable: true })
  language: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @Column({ name: 'signed_at', type: 'timestamptz' })
  signedAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}

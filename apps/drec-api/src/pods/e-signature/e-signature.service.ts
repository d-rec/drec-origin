import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'crypto';
import { ESignatureLog } from './e-signature-log.entity';

export interface ESignatureInput {
  userId: number;
  userEmail: string;
  organizationId?: number;
  action: string;
  consentText: string;
  consentVersion?: string;
  /** Raw payload to hash (e.g. the device JSON string) */
  payloadToHash?: string;
  deviceId?: number;
  deviceExternalId?: string;
  ipAddress?: string;
  userAgent?: string;
  browserFingerprint?: string;
  screenResolution?: string;
  timezone?: string;
  language?: string;
  metadata?: Record<string, any>;
  signedAt?: Date;
}

@Injectable()
export class ESignatureService {
  private readonly logger = new Logger(ESignatureService.name);

  constructor(
    @InjectRepository(ESignatureLog)
    private readonly repository: Repository<ESignatureLog>,
  ) {}

  async log(input: ESignatureInput): Promise<ESignatureLog> {
    const documentHash = input.payloadToHash
      ? createHash('sha256').update(input.payloadToHash).digest('hex')
      : null;

    const entry = this.repository.create({
      userId: input.userId,
      userEmail: input.userEmail,
      organizationId: input.organizationId ?? null,
      action: input.action,
      consentText: input.consentText,
      consentVersion: input.consentVersion ?? '1.0',
      documentHash,
      deviceId: input.deviceId ?? null,
      deviceExternalId: input.deviceExternalId ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      browserFingerprint: input.browserFingerprint ?? null,
      screenResolution: input.screenResolution ?? null,
      timezone: input.timezone ?? null,
      language: input.language ?? null,
      metadata: input.metadata ?? null,
      signedAt: input.signedAt ?? new Date(),
    });

    const saved = await this.repository.save(entry);
    this.logger.log(
      `E-signature logged: action=${input.action} user=${input.userEmail} hash=${documentHash}`,
    );
    return saved;
  }

  async findByDevice(deviceId: number): Promise<ESignatureLog[]> {
    return this.repository.find({
      where: { deviceId },
      order: { signedAt: 'DESC' },
    });
  }

  async findByUser(userId: number): Promise<ESignatureLog[]> {
    return this.repository.find({
      where: { userId },
      order: { signedAt: 'DESC' },
    });
  }
}

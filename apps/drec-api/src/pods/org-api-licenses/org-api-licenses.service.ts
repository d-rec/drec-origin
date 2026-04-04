import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrgApiLicenses } from './org-api-licenses.entity';
import { SaveApiKeysDTO } from './dto/save-api-keys.dto';
import { isMasked, mask } from '../../utils/mask';
import { decrypt, encrypt } from '../../utils/crypto';
import { getRedisClient } from '../../lib/redis';
import { RedisKeys } from '../../utils/enums/redis-keys.enum';

export type ServiceType = 'roboflow' | 'deepl';

@Injectable()
export class OrgApiLicensesService {
  private readonly logger = new Logger(OrgApiLicensesService.name);
  private redis = null;

  constructor(
    @InjectRepository(OrgApiLicenses)
    private readonly repository: Repository<OrgApiLicenses>,
  ) {
    this.redis = getRedisClient();
  }

  async initializeCredits(organizationId: number): Promise<OrgApiLicenses> {
    const existing = await this.repository.findOne({
      where: { organizationId },
    });
    if (existing) return existing;

    return this.repository.save({
      organizationId,
      roboflowCreditsRemaining: 3,
      deeplCreditsRemaining: 3,
    });
  }

  async save(
    organizationId: number,
    dto: SaveApiKeysDTO,
  ): Promise<OrgApiLicenses> {
    let record = await this.repository.findOne({
      where: { organizationId },
    });

    if (!record) {
      record = await this.initializeCredits(organizationId);
    }

    if (dto.roboflowApiKey !== undefined) {
      record.roboflowApiKey =
        dto.roboflowApiKey === null || dto.roboflowApiKey === ''
          ? null
          : isMasked(dto.roboflowApiKey)
            ? record.roboflowApiKey
            : encrypt(dto.roboflowApiKey);
    }

    if (dto.deeplApiKey !== undefined) {
      record.deeplApiKey =
        dto.deeplApiKey === null || dto.deeplApiKey === ''
          ? null
          : isMasked(dto.deeplApiKey)
            ? record.deeplApiKey
            : encrypt(dto.deeplApiKey);
    }

    record.updatedAt = new Date();
    await this.redis.del(this.getRedisKey(organizationId));
    return this.repository.save(record);
  }

  async findMasked(
    organizationId: number,
  ): Promise<{
    roboflowApiKey: string | null;
    deeplApiKey: string | null;
    roboflowCreditsRemaining: number;
    deeplCreditsRemaining: number;
  } | null> {
    const record = await this.findCached(organizationId);
    if (!record) return null;

    return {
      roboflowApiKey: record.roboflowApiKey
        ? this.safeDecryptAndMask(record.roboflowApiKey)
        : null,
      deeplApiKey: record.deeplApiKey
        ? this.safeDecryptAndMask(record.deeplApiKey)
        : null,
      roboflowCreditsRemaining: record.roboflowCreditsRemaining,
      deeplCreditsRemaining: record.deeplCreditsRemaining,
    };
  }

  async findDecrypted(
    organizationId: number,
  ): Promise<{
    roboflowApiKey: string | null;
    deeplApiKey: string | null;
    roboflowCreditsRemaining: number;
    deeplCreditsRemaining: number;
  } | null> {
    const record = await this.findCached(organizationId);
    if (!record) return null;

    return {
      roboflowApiKey: record.roboflowApiKey
        ? decrypt(record.roboflowApiKey)
        : null,
      deeplApiKey: record.deeplApiKey ? decrypt(record.deeplApiKey) : null,
      roboflowCreditsRemaining: record.roboflowCreditsRemaining,
      deeplCreditsRemaining: record.deeplCreditsRemaining,
    };
  }

  async getCredits(
    organizationId: number,
  ): Promise<{ roboflow: number; deepl: number }> {
    const record = await this.findCached(organizationId);
    return {
      roboflow: record?.roboflowCreditsRemaining ?? 0,
      deepl: record?.deeplCreditsRemaining ?? 0,
    };
  }

  async hasOwnKey(
    organizationId: number,
    service: ServiceType,
  ): Promise<boolean> {
    const record = await this.findCached(organizationId);
    if (!record) return false;
    return service === 'roboflow'
      ? record.roboflowApiKey !== null
      : record.deeplApiKey !== null;
  }

  async deductCredit(
    organizationId: number,
    service: ServiceType,
  ): Promise<boolean> {
    const column =
      service === 'roboflow'
        ? 'roboflow_credits_remaining'
        : 'deepl_credits_remaining';

    const result = await this.repository.query(
      `UPDATE "org_api_licenses"
       SET "${column}" = "${column}" - 1, "updated_at" = now()
       WHERE "organization_id" = $1 AND "${column}" > 0
       RETURNING "${column}"`,
      [organizationId],
    );

    if (result.length === 0) {
      return false;
    }

    await this.redis.del(this.getRedisKey(organizationId));
    return true;
  }

  private async findCached(
    organizationId: number,
  ): Promise<OrgApiLicenses | null> {
    const cacheKey = this.getRedisKey(organizationId);
    const cachedData = await this.redis.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const record = await this.repository.findOne({
      where: { organizationId },
    });
    if (!record) return null;

    await this.redis.set(cacheKey, JSON.stringify(record), 'EX', 600);
    return record;
  }

  private getRedisKey(organizationId: number): string {
    return `${RedisKeys.OrgApiLicenses}:${organizationId}`;
  }

  private safeDecryptAndMask(encrypted: string): string {
    try {
      const decrypted = decrypt(encrypted);
      return mask(decrypted);
    } catch {
      return '***';
    }
  }
}

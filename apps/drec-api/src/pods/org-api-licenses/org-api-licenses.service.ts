import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrgApiLicenses } from './org-api-licenses.entity';
import { SaveApiKeysDTO } from './dto/save-api-keys.dto';
import { isMasked, mask } from '../../utils/mask';
import { decrypt, encrypt } from '../../utils/crypto';
import { getRedisClient } from '../../lib/redis';
import { RedisKeys } from '../../utils/enums/redis-keys.enum';

export type ServiceType = 'roboflow' | 'deepl' | 'anthropic';

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
      anthropicCreditsRemaining: 50,
    });
  }

  async save(
    organizationId: number,
    dto: SaveApiKeysDTO,
    actor?: { userId?: number; email?: string; role?: string },
  ): Promise<OrgApiLicenses> {
    let record = await this.repository.findOne({
      where: { organizationId },
    });
    const lazyCreated = !record;
    if (!record) {
      record = await this.initializeCredits(organizationId);
    }

    const audit: string[] = [];
    const actorTag = `org=${organizationId} actor=${actor?.email || actor?.userId || 'unknown'} (${actor?.role || '?'})`;

    const apply = (
      field:
        | 'roboflowApiKey'
        | 'roboflowWorkflowUrl'
        | 'deeplApiKey'
        | 'anthropicApiKey',
      label: string,
      newValue: string | undefined,
      clearFlag: boolean | undefined,
    ): void => {
      const had = record![field] != null;
      // undefined → not present in the request, no change.
      if (newValue === undefined) return;

      // Empty/null without an explicit clear flag is treated as "no change"
      // when there's an existing value. This is the guard against the
      // accidental-wipe pattern.
      if (newValue === null || newValue === '') {
        if (had && !clearFlag) {
          audit.push(
            `${label}: BLANK SUBMITTED but no clear flag — preserving existing (use clear${field[0].toUpperCase()}${field.slice(1)}: true to wipe).`,
          );
          this.logger.warn(
            `[org-api-licenses] ${actorTag}: blank ${label} without clear flag — preserved existing key`,
          );
          return;
        }
        if (had && clearFlag) {
          record![field] = null as any;
          audit.push(`${label}: CLEARED (was set)`);
          this.logger.warn(
            `[org-api-licenses] ${actorTag}: explicitly cleared ${label}`,
          );
        }
        // else: empty + no existing → still null, nothing to log.
        return;
      }

      // Non-empty: masked → preserve, otherwise encrypt + replace.
      if (isMasked(newValue)) {
        audit.push(`${label}: masked sentinel — preserving existing`);
        return;
      }
      record![field] = encrypt(newValue) as any;
      audit.push(had ? `${label}: REPLACED` : `${label}: SET (was empty)`);
    };

    apply(
      'roboflowApiKey',
      'roboflowApiKey',
      dto.roboflowApiKey,
      dto.clearRoboflowApiKey,
    );
    apply(
      'roboflowWorkflowUrl',
      'roboflowWorkflowUrl',
      dto.roboflowWorkflowUrl,
      dto.clearRoboflowWorkflowUrl,
    );
    apply(
      'deeplApiKey',
      'deeplApiKey',
      dto.deeplApiKey,
      dto.clearDeeplApiKey,
    );
    apply(
      'anthropicApiKey',
      'anthropicApiKey',
      dto.anthropicApiKey,
      dto.clearAnthropicApiKey,
    );

    if (audit.length === 0) {
      this.logger.log(
        `[org-api-licenses] ${actorTag}: save() called with no changes`,
      );
    } else {
      this.logger.log(
        `[org-api-licenses] ${actorTag}${lazyCreated ? ' (lazy-created row)' : ''}: ${audit.join('; ')}`,
      );
    }

    record.updatedAt = new Date();
    await this.redis.del(this.getRedisKey(organizationId));
    return this.repository.save(record);
  }

  async findMasked(
    organizationId: number,
  ): Promise<{
    roboflowApiKey: string | null;
    roboflowWorkflowUrl: string | null;
    deeplApiKey: string | null;
    anthropicApiKey: string | null;
    roboflowCreditsRemaining: number;
    deeplCreditsRemaining: number;
    anthropicCreditsRemaining: number;
  } | null> {
    const record = await this.findCached(organizationId);
    if (!record) return null;

    return {
      roboflowApiKey: record.roboflowApiKey
        ? this.safeDecryptAndMask(record.roboflowApiKey)
        : null,
      roboflowWorkflowUrl: record.roboflowWorkflowUrl
        ? this.safeDecryptAndMask(record.roboflowWorkflowUrl)
        : null,
      deeplApiKey: record.deeplApiKey
        ? this.safeDecryptAndMask(record.deeplApiKey)
        : null,
      anthropicApiKey: record.anthropicApiKey
        ? this.safeDecryptAndMask(record.anthropicApiKey)
        : null,
      roboflowCreditsRemaining: record.roboflowCreditsRemaining,
      deeplCreditsRemaining: record.deeplCreditsRemaining,
      anthropicCreditsRemaining: record.anthropicCreditsRemaining,
    };
  }

  async findDecrypted(
    organizationId: number,
  ): Promise<{
    roboflowApiKey: string | null;
    roboflowWorkflowUrl: string | null;
    deeplApiKey: string | null;
    anthropicApiKey: string | null;
    roboflowCreditsRemaining: number;
    deeplCreditsRemaining: number;
    anthropicCreditsRemaining: number;
  } | null> {
    const record = await this.findCached(organizationId);
    if (!record) return null;

    return {
      roboflowApiKey: record.roboflowApiKey
        ? decrypt(record.roboflowApiKey)
        : null,
      roboflowWorkflowUrl: record.roboflowWorkflowUrl
        ? decrypt(record.roboflowWorkflowUrl)
        : null,
      deeplApiKey: record.deeplApiKey ? decrypt(record.deeplApiKey) : null,
      anthropicApiKey: record.anthropicApiKey
        ? decrypt(record.anthropicApiKey)
        : null,
      roboflowCreditsRemaining: record.roboflowCreditsRemaining,
      deeplCreditsRemaining: record.deeplCreditsRemaining,
      anthropicCreditsRemaining: record.anthropicCreditsRemaining,
    };
  }

  async getCredits(
    organizationId: number,
  ): Promise<{ roboflow: number; deepl: number; anthropic: number }> {
    const record = await this.findCached(organizationId);
    return {
      roboflow: record?.roboflowCreditsRemaining ?? 0,
      deepl: record?.deeplCreditsRemaining ?? 0,
      anthropic: record?.anthropicCreditsRemaining ?? 0,
    };
  }

  async hasOwnKey(
    organizationId: number,
    service: ServiceType,
  ): Promise<boolean> {
    const record = await this.findCached(organizationId);
    if (!record) return false;
    if (service === 'roboflow') return record.roboflowApiKey !== null;
    if (service === 'deepl') return record.deeplApiKey !== null;
    return record.anthropicApiKey !== null;
  }

  async deductCredit(
    organizationId: number,
    service: ServiceType,
  ): Promise<boolean> {
    const column =
      service === 'roboflow'
        ? 'roboflow_credits_remaining'
        : service === 'deepl'
          ? 'deepl_credits_remaining'
          : 'anthropic_credits_remaining';

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

  async findAdminOrgDecrypted(): Promise<{
    roboflowApiKey: string | null;
    roboflowWorkflowUrl: string | null;
    deeplApiKey: string | null;
    anthropicApiKey: string | null;
  }> {
    // Find the Admin user's org — cached in Redis for 10 min
    const adminOrgCacheKey = 'platform:admin_org_id';
    let adminOrgId: number | null = null;

    const cached = await this.redis.get(adminOrgCacheKey);
    if (cached) {
      adminOrgId = parseInt(cached, 10);
    } else {
      const rows = await this.repository.query(
        `SELECT "organizationId" FROM public.user WHERE "role" = 'Admin' LIMIT 1`,
      );
      if (rows.length > 0) {
        adminOrgId = rows[0].organizationId;
        await this.redis.set(adminOrgCacheKey, String(adminOrgId), 'EX', 600);
      }
    }

    if (!adminOrgId) {
      this.logger.warn('No Admin user found — platform API keys unavailable');
      return {
        roboflowApiKey: null,
        roboflowWorkflowUrl: null,
        deeplApiKey: null,
        anthropicApiKey: null,
      };
    }

    const result = await this.findDecrypted(adminOrgId);
    return {
      roboflowApiKey: result?.roboflowApiKey ?? null,
      roboflowWorkflowUrl: result?.roboflowWorkflowUrl ?? null,
      deeplApiKey: result?.deeplApiKey ?? null,
      anthropicApiKey: result?.anthropicApiKey ?? null,
    };
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

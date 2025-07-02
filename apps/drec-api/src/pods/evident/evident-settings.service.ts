import { Injectable } from '@nestjs/common';
import { SettingsDTO } from './settings.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { EvidentSettings } from './evident-settings.entity';
import { Repository } from 'typeorm';
import { isMasked } from '../../utils/mask';
import { decrypt, encrypt } from '../../utils/crypto';
import { getRedisClient } from '../../lib/redis';
import { RedisKeys } from '../../utils/enums/redis-keys.enum';

@Injectable()
export class EvidentSettingsService {
  private redis = null;

  constructor(
    @InjectRepository(EvidentSettings)
    private readonly repository: Repository<EvidentSettings>,
  ) {
    this.redis = getRedisClient();
  }

  async save(
    organizationId: number,
    settings: SettingsDTO,
  ): Promise<SettingsDTO> {
    const existingSettings = await this.repository.findOne({
      where: { organizationId },
    });

    if (!existingSettings) {
      return await this.repository.save({
        ...settings,
        apiKey: encrypt(settings.apiKey),
        organizationId,
      });
    }

    const apiKey = isMasked(settings.apiKey)
      ? existingSettings.apiKey
      : encrypt(settings.apiKey);

    const updated = this.repository.merge(existingSettings, {
      ...settings,
      apiKey,
      organizationId,
    });
    await this.redis.del(this.getRedisKey(organizationId));
    return await this.repository.save(updated);
  }

  async updateLastIssuanceSyncedAt(organizationId: number): Promise<void> {
    const settings = await this.repository.findOne({
      where: { organizationId },
    });

    if (!settings) return;

    settings.lastIssuanceSyncedAt = new Date();
    await this.repository.save(settings);
    await this.redis.del(this.getRedisKey(organizationId));
  }

  async find(organizationId: number): Promise<SettingsDTO> {
    const data = await this.findCached(organizationId);
    if (!data) return null;
    return {
      ...data,
      apiKey: decrypt(data.apiKey),
    };
  }

  private async findCached(organizationId: number): Promise<SettingsDTO> {
    const cacheKey = this.getRedisKey(organizationId);
    const cachedData = await this.redis.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const settings = await this.repository.findOne({
      where: { organizationId },
    });
    if (!settings) return null;

    await this.redis.set(cacheKey, JSON.stringify(settings), 'EX', 600); // Cache for 10 minutes
    return settings;
  }

  private getRedisKey(organizationId: number): string {
    return `${RedisKeys.EvidentSettings}:${organizationId}`;
  }
}

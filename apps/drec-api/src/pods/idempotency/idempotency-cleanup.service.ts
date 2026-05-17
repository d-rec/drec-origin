import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LessThan, Repository } from 'typeorm';
import { IdempotencyKeyEntity } from './idempotency-key.entity';

const TTL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class IdempotencyCleanupService {
  private readonly logger = new Logger(IdempotencyCleanupService.name);

  constructor(
    @InjectRepository(IdempotencyKeyEntity)
    private readonly repo: Repository<IdempotencyKeyEntity>,
  ) {}

  /** Evict rows older than 24h. Hourly is plenty — the table stays
   *  small even under sustained load because each row is one POST. */
  @Cron(CronExpression.EVERY_HOUR)
  async evict(): Promise<void> {
    const cutoff = new Date(Date.now() - TTL_MS);
    const { affected } = await this.repo.delete({ createdAt: LessThan(cutoff) });
    if (affected) {
      this.logger.log(`Evicted ${affected} expired idempotency key(s)`);
    }
  }
}

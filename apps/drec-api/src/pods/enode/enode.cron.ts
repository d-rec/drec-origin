import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { NonConcurrentCron } from '../../lib/cron';
import { EnodeSyncService } from './enode-sync.service';

/**
 * Periodically polls Enode and ingests new production as meter reads.
 *
 * The schedule can be overridden with `ENODE_POLL_CRON` (read at class-eval
 * time, as the decorator needs a static expression); defaults to hourly, which
 * is plenty for counter-delta ingestion. The handler itself early-returns when
 * the integration is unconfigured, so registering the cron is harmless.
 */
@Injectable()
export class EnodeCron {
  private readonly logger = new Logger(EnodeCron.name);

  constructor(private readonly sync: EnodeSyncService) {}

  @NonConcurrentCron(process.env.ENODE_POLL_CRON || CronExpression.EVERY_HOUR)
  async poll(): Promise<void> {
    await this.sync.sync();
  }
}

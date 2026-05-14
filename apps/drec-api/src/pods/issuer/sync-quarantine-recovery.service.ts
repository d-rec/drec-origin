import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CronExpression } from '@nestjs/schedule';
import { providers } from 'ethers';
import { NonConcurrentCron } from '../../lib/cron';

/**
 * SyncQuarantineRecoveryService
 *
 * Background:
 *   @energyweb/origin-247-certificate v4.1.5 tracks each blockchain
 *   sync attempt in the `certificate_synchronization_attempt` table.
 *   When `attempts_count` reaches MAX_SYNCHRONIZATION_ATTEMPTS_FOR_EVENT
 *   the library permanently filters that row out of subsequent sync
 *   queries, leaving the certificate stranded until an operator manually
 *   runs `UPDATE certificate_synchronization_attempt SET attempts_count = 0`.
 *
 *   On 2026-04-27 a ~8-hour EVM RPC outage caused 45 certificates to
 *   exhaust their retry budget in under 30 seconds and stay quarantined
 *   for 3 days.  This service provides automatic recovery: every hour it
 *   checks whether the chain is reachable and, if so, resets quarantined
 *   rows so the library's next sweep can re-process them.
 */
@Injectable()
export class SyncQuarantineRecoveryService {
  private readonly logger = new Logger(SyncQuarantineRecoveryService.name);

  /** Mirror of MAX_SYNCHRONIZATION_ATTEMPTS_FOR_EVENT from the library. */
  private readonly maxAttempts: number;

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {
    // Read from env so it stays in sync with however the library is configured.
    const envVal = parseInt(
      process.env.MAX_SYNCHRONIZATION_ATTEMPTS_FOR_EVENT ?? '8',
      10,
    );
    this.maxAttempts = Number.isFinite(envVal) && envVal > 0 ? envVal : 8;
  }

  /**
   * Hourly sweep: if the chain is reachable reset any quarantined
   * certificate_synchronization_attempt rows.
   */
  @NonConcurrentCron(CronExpression.EVERY_HOUR)
  public async recoverQuarantinedEvents(): Promise<void> {
    this.logger.log('SyncQuarantineRecovery: sweep started');

    const chainReachable = await this.isChainReachable();
    if (!chainReachable) {
      this.logger.warn(
        'SyncQuarantineRecovery: chain unreachable — skipping reset to avoid resetting during an active outage',
      );
      return;
    }

    await this.resetQuarantinedRows();
  }

  /**
   * Attempts a lightweight eth_blockNumber call to verify the JSON-RPC
   * provider is responding before we unquarantine events.
   */
  public async isChainReachable(): Promise<boolean> {
    const web3Env = process.env.WEB3 ?? '';
    const [primaryRpc, fallbackRpc] = web3Env.split(';');
    const rpcUrl = primaryRpc?.trim() || fallbackRpc?.trim();

    if (!rpcUrl) {
      this.logger.warn(
        'SyncQuarantineRecovery: WEB3 env var is not set; assuming chain is reachable',
      );
      return true;
    }

    try {
      const provider = new providers.JsonRpcProvider(rpcUrl);
      await provider.getBlockNumber();
      return true;
    } catch (err) {
      this.logger.warn(
        `SyncQuarantineRecovery: chain health check failed — ${(err as Error).message}`,
      );
      return false;
    }
  }

  /**
   * Resets attempts_count and clears the error message for any rows that
   * have reached the maximum retry cap, making them eligible for the next
   * BlockchainSynchronizeService sweep.
   *
   * Returns the number of rows updated.
   */
  public async resetQuarantinedRows(): Promise<number> {
    const result = await this.dataSource.query<{ affected: string }[]>(
      `UPDATE certificate_synchronization_attempt
          SET attempts_count = 0,
              error = NULL
        WHERE attempts_count >= $1`,
      [this.maxAttempts],
    );

    // pg driver returns an array; the second element is the row count.
    const affected: number =
      Array.isArray(result) && typeof result[1] === 'number' ? result[1] : 0;

    if (affected > 0) {
      this.logger.log(
        `SyncQuarantineRecovery: reset ${affected} quarantined row(s) — they will be retried on the next sync`,
      );
    } else {
      this.logger.log(
        'SyncQuarantineRecovery: no quarantined rows found — nothing to reset',
      );
    }

    return affected;
  }
}

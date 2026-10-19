import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { getQueueToken } from '@nestjs/bull';
import { ModuleRef } from '@nestjs/core';
import { Queue } from 'bull';
import { v4 as uuid4 } from 'uuid';
import { getRedisClient } from './redis';

/**
 * Every queue below ends in a transaction signed by the one issuer wallet.
 * `@Process({ concurrency: 1 })` on their consumers bounds concurrency *per
 * process*, so with N replicas there are N signers, and two signers on one
 * wallet collide on the nonce.
 *
 * On 2026-10-19 that stranded 13 group-185 certificates: 124 RPC rejections
 * ("Transaction gas price supplied is too low. There is another transaction
 * with same nonce in the queue") across both prod replicas between 08:19 and
 * 10:32, until the certificates hit MAX_SYNCHRONIZATION_ATTEMPTS_FOR_EVENT
 * and `findAllToProcess` excluded them permanently. The cron lock in
 * ./cron.ts did not and cannot prevent it: it guards
 * SynchronizeBlockchainTaskService, which only *enqueues* and returns in
 * milliseconds. The signing happens later, in these consumers, outside it.
 *
 * So the lock has to move to the consumers. Exactly one replica is elected
 * leader; it alone runs the workers for these queues. The others keep their
 * HTTP role and their other queues, and enqueue as before — jobs simply wait
 * in Redis for the leader to drain them.
 */
const LEADER_QUEUES = [
  // @energyweb/origin-247-certificate — blockchainQueueName. Signs and sends.
  'blockchain-actions',
  // @energyweb/origin-247-certificate — SYNCHRONIZE_QUEUE_NAME. Batches events
  // and feeds blockchain-actions; two copies build identical batches.
  'blockchain-synchronize',
];

/**
 * Deliberately the same shape as the cron lock: a short TTL carried by a
 * heartbeat, so the TTL only decides how long leadership survives a pod that
 * died without releasing it — not how long a job is allowed to take.
 */
const LEADER_TTL_SECONDS = 120;
const HEARTBEAT_MS = (LEADER_TTL_SECONDS / 3) * 1000;

const LEADER_KEY = 'blockchain-queue-leader';

/** Extend only if still ours, atomically. */
const RENEW_IF_OWNED = `
  if redis.call('get', KEYS[1]) == ARGV[1] then
    return redis.call('expire', KEYS[1], ARGV[2])
  end
  return 0
`;

/** Release only if still ours, atomically. */
const DELETE_IF_OWNED = `
  if redis.call('get', KEYS[1]) == ARGV[1] then
    return redis.call('del', KEYS[1])
  end
  return 0
`;

@Injectable()
export class BlockchainQueueLeaderService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(BlockchainQueueLeaderService.name);
  private readonly redis = getRedisClient();

  /** Identifies this replica's claim, so renew/release can't act on another's. */
  private readonly instanceId = uuid4();

  private queues: Queue[] = [];
  private isLeader = false;
  private heartbeat?: NodeJS.Timeout;

  /**
   * A tick that has to wait for an in-flight mint can outlast the heartbeat
   * interval. Without this the timer would stack elections on top of each
   * other and we could pause and resume in the wrong order.
   */
  private electing = false;

  constructor(private readonly moduleRef: ModuleRef) {}

  async onApplicationBootstrap(): Promise<void> {
    // strict:false searches the whole container. The queues are registered by
    // the vendor's own modules, and local pause/resume only affects the
    // workers attached to *that* Queue instance — so we must hold the very
    // instance the vendor's @Processor bound to, not a fresh registration of
    // the same name.
    for (const name of LEADER_QUEUES) {
      try {
        this.queues.push(
          this.moduleRef.get<Queue>(getQueueToken(name), { strict: false }),
        );
      } catch {
        // Nothing registered this queue in this build (unit tests, or a
        // deployment that doesn't import the certificate modules). Leaving it
        // out is correct: there is no local worker to pause.
        this.logger.warn(`queue "${name}" not registered — not managed`);
      }
    }

    if (!this.queues.length) {
      this.logger.warn('no blockchain queues found — leader election disabled');
      return;
    }

    // Start paused, before the first election. A replica that signed during
    // the window between boot and losing an election would be the exact race
    // this service exists to close.
    await this.pauseLocal();

    await this.elect();
    this.heartbeat = setInterval(() => {
      this.elect().catch((err) =>
        this.logger.warn(`election failed: ${err?.message}`),
      );
    }, HEARTBEAT_MS);
    this.heartbeat.unref?.();
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.heartbeat) clearInterval(this.heartbeat);
    try {
      // Hand leadership over immediately rather than making the next replica
      // wait out the TTL.
      if (this.isLeader) {
        await this.redis.eval(DELETE_IF_OWNED, 1, LEADER_KEY, this.instanceId);
      }
    } catch (err: any) {
      this.logger.warn(`releasing leadership failed: ${err?.message}`);
    } finally {
      await this.redis.quit().catch(() => undefined);
    }
  }

  /** True on the one replica currently permitted to sign. For /health. */
  get leader(): boolean {
    return this.isLeader;
  }

  private async elect(): Promise<void> {
    if (this.electing) return;
    this.electing = true;
    try {
      const held = await this.claim();

      if (held && !this.isLeader) {
        this.isLeader = true;
        await this.resumeLocal();
        this.logger.log('elected leader — blockchain queues resumed here');
      } else if (!held && this.isLeader) {
        this.isLeader = false;
        await this.pauseLocal();
        this.logger.warn('lost leadership — blockchain queues paused here');
      }
    } finally {
      this.electing = false;
    }
  }

  /**
   * Renew first, acquire second. Renewing is what the steady-state leader
   * does; the NX acquire only matters on the tick after the previous leader
   * died or shut down.
   */
  private async claim(): Promise<boolean> {
    const renewed = (await this.redis.eval(
      RENEW_IF_OWNED,
      1,
      LEADER_KEY,
      this.instanceId,
      String(LEADER_TTL_SECONDS),
    )) as number;
    if (renewed === 1) return true;

    const acquired = await this.redis.set(
      LEADER_KEY,
      this.instanceId,
      'EX',
      LEADER_TTL_SECONDS,
      'NX',
    );
    return acquired === 'OK';
  }

  /**
   * pause(true) is local: it stops *this* process consuming and leaves the
   * jobs in Redis for the leader. Deliberately not passing doNotWaitActive —
   * a job already signing must finish, never be abandoned mid-transaction.
   */
  private async pauseLocal(): Promise<void> {
    await Promise.all(
      this.queues.map((q) =>
        q
          .pause(true)
          .catch((err) =>
            this.logger.warn(`pausing ${q.name} failed: ${err?.message}`),
          ),
      ),
    );
  }

  private async resumeLocal(): Promise<void> {
    await Promise.all(
      this.queues.map((q) =>
        q
          .resume(true)
          .catch((err) =>
            this.logger.warn(`resuming ${q.name} failed: ${err?.message}`),
          ),
      ),
    );
  }
}

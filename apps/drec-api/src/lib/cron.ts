import { Cron, CronOptions } from '@nestjs/schedule';
import { getRedisClient } from './redis';
import { Logger } from '@nestjs/common';
import { v4 as uuid4 } from 'uuid';

// Lock expiration time in seconds. Deliberately short: the lock is now
// renewed on a heartbeat while the job runs, so the TTL no longer has to
// cover the longest possible run -- it only decides how long a lock survives
// a pod that died without releasing it.
const LOCK_TTL = 120;

// How often to extend the lock. A third of the TTL leaves room for two
// missed renewals (a GC pause, a Redis blip) before the lock can lapse.
const LOCK_RENEW_INTERVAL_MS = (LOCK_TTL / 3) * 1000;

/**
 * Extend the lock only if we still hold it, in one atomic step. A GET
 * followed by a separate EXPIRE could renew a lock that another instance
 * acquired in between.
 */
const RENEW_IF_OWNED = `
  if redis.call('get', KEYS[1]) == ARGV[1] then
    return redis.call('expire', KEYS[1], ARGV[2])
  end
  return 0
`;

/** Same compare-and-act, for release. */
const DELETE_IF_OWNED = `
  if redis.call('get', KEYS[1]) == ARGV[1] then
    return redis.call('del', KEYS[1])
  end
  return 0
`;

/**
 * Executes a function with Redis-based distributed locking
 *
 * @param key - Unique identifier for the lock
 * @param fn - Function to execute exclusively
 * @returns Promise resolved with the return value of fn, or undefined if already locked
 */
const runExclusive = async <T>(
  context: string,
  functionName: string,
  fn: () => Promise<T>,
): Promise<T | undefined> => {
  const redis = getRedisClient();
  const logger = new Logger(context);

  const key = `cron-lock:${context}:${functionName}`;
  const lockId = uuid4(); // Generate unique lock value

  // Outer try/finally guarantees the ioredis connection is released on every
  // path — including the early `return` when the lock is already held, and any
  // throw from redis.set/get. Without this, each cron tick leaked a client and
  // Redis eventually hit maxclients: the PowerTrust env accumulated ~10k idle
  // connections over 17 days (2026-06-18), stalling all certificate issuance.
  try {
    // Try to acquire the lock
    const isLocked = await redis.set(key, lockId, 'EX', LOCK_TTL, 'NX');

    if (!isLocked) {
      logger.log(`${functionName}: Already running on another instance.`);
      return;
    }

    // Keep the lock alive for as long as the job runs. Without this a run
    // that outlasts LOCK_TTL silently loses its lock and the next tick starts
    // a SECOND copy on the other replica -- which is not merely wasted work:
    // both copies then submit blockchain transactions from the same issuer
    // wallet with the same nonce. On 2026-10-12 a certificate synchronize run
    // took 63 minutes against the old 600s TTL and did exactly that, logging
    // 3,614 nonce collisions ("Transaction with the same hash was already
    // imported", "another transaction with same nonce in the queue") across
    // 451 certificates and permanently stranding 8 of them once they
    // exhausted MAX_SYNCHRONIZATION_ATTEMPTS_FOR_EVENT.
    let lockLost = false;
    const renewal = setInterval(() => {
      // Fire-and-forget: this runs on a timer, so there is nobody to await it.
      redis
        .eval(RENEW_IF_OWNED, 1, key, lockId, String(LOCK_TTL))
        .then((extended) => {
          if (extended !== 1 && !lockLost) {
            lockLost = true;
            logger.error(
              `${functionName}: lock lost while still running — another ` +
                `instance may now be running this job concurrently.`,
            );
          }
        })
        .catch((err) => {
          logger.warn(`${functionName}: lock renewal failed: ${err?.message}`);
        });
    }, LOCK_RENEW_INTERVAL_MS);
    // Do not let the heartbeat hold the event loop open on shutdown.
    renewal.unref?.();

    try {
      return await fn();
    } finally {
      clearInterval(renewal);
      // Compare-and-delete, so a lock that has since been taken over by
      // another instance is never deleted from under it.
      const released = await redis.eval(DELETE_IF_OWNED, 1, key, lockId);
      if (released === 1) {
        logger.log(`${functionName}: Lock released successfully.`);
      } else {
        logger.warn(`${functionName}: Lock ownership lost, not deleting lock.`);
      }
    }
  } finally {
    await redis.quit();
  }
};

/**
 * UniqueCron Decorator - Ensures a cron job never runs concurrently with itself
 *
 * This decorator extends the standard Cron decorator by adding mutex-based locking
 * to prevent multiple simultaneous executions of the same cron job.
 *
 * @param cronTime - Cron expression string or Date for when to execute the job
 * @param options - Optional configuration for the Cron job
 * @returns Decorator function that can be applied to class methods
 */
function NonConcurrentCron(
  cronTime: string | Date,
  options?: CronOptions,
): MethodDecorator {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const className = target?.constructor?.name || '';
    // Store the original method
    const originalMethod = descriptor.value;

    // Replace with our wrapped implementation
    descriptor.value = function (...args: any[]) {
      // Acquire the lock and execute the method
      return runExclusive(className, propertyKey, async () => {
        // Execute the original method with the same context and arguments
        return originalMethod.apply(this, args);
      });
    };

    // Apply the original Cron decorator to handle scheduling
    return Cron(cronTime, options)(target, propertyKey, descriptor);
  };
}

export { NonConcurrentCron };

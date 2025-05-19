import { Cron, CronOptions } from '@nestjs/schedule';
import { getRedisClient } from './redis';
import { Logger } from '@nestjs/common';

// Lock expiration time in seconds
const LOCK_TTL = 60;

/**
 * Executes a function with Redis-based distributed locking
 *
 * @param key - Unique identifier for the lock
 * @param fn - Function to execute exclusively
 * @returns Promise resolved with the return value of fn, or undefined if already locked
 */
const runExclusive = async <T>(
  key: string,
  fn: () => Promise<T>,
): Promise<T | undefined> => {
  const redis = getRedisClient();
  const logger = new Logger(key);

  // Try to acquire the lock
  const isLocked = await redis.set(key, 'locked', 'EX', LOCK_TTL, 'NX');

  if (!isLocked) {
    logger.debug('This cron job is already running on another instance.');
    return;
  }

  try {
    return await fn();
  } finally {
    // Lock will expire automatically after LOCK_TTL seconds
    // Uncomment the following line if you want to release the lock immediately after execution
    // await redis.del(key);
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
    // Store the original method
    const originalMethod = descriptor.value;

    // Replace with our wrapped implementation
    descriptor.value = function (...args: any[]) {
      // Acquire the lock and execute the method
      return runExclusive(propertyKey, async () => {
        // Execute the original method with the same context and arguments
        return originalMethod.apply(this, args);
      });
    };

    // Apply the original Cron decorator to handle scheduling
    return Cron(cronTime, options)(target, propertyKey, descriptor);
  };
}

export { NonConcurrentCron };

import { Cron, CronOptions } from '@nestjs/schedule';
import { getRedisClient } from './redis';
import { Logger } from '@nestjs/common';
import { v4 as uuid4 } from 'uuid';

// Lock expiration time in seconds
const LOCK_TTL = 600;

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

  // Try to acquire the lock
  const isLocked = await redis.set(key, lockId, 'EX', LOCK_TTL, 'NX');

  if (!isLocked) {
    logger.log(`${functionName}: Already running on another instance.`);
    return;
  }

  try {
    return await fn();
  } finally {
    // Ensure we only delete the lock if we still own it
    const currentLockId = await redis.get(key);
    if (currentLockId === lockId) {
      logger.log(`${functionName}: Lock released successfully.`);
      // Delete the lock
      await redis.del(key);
    } else {
      logger.warn(`${functionName}: Lock ownership lost, not deleting lock.`);
    }
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

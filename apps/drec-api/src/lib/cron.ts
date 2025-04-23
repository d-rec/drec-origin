import { Logger } from "@nestjs/common";
import { Cron, CronOptions } from "@nestjs/schedule";
import { Mutex } from "async-mutex";

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
function NonConcurrentCron(cronTime: string | Date, options?: CronOptions): MethodDecorator {
    // Create a mutex lock to prevent concurrent execution
    const mutex = new Mutex();
    // Create a logger instance
    const logger = new Logger();
    
    return function (
        target: any, 
        propertyKey: string, 
        descriptor: PropertyDescriptor
    ) {
        // Store the original method
        const originalMethod = descriptor.value;
        
        // Replace with our wrapped implementation
        descriptor.value = function(...args: any[]) {
            // Check if this job is already running
            if (mutex.isLocked()) {
                logger.debug(`Cron job is already running - skipping execution`, propertyKey);
                return;
            }
            
            // Acquire the lock and execute the method
            return mutex.runExclusive(async () => {
                // Execute the original method with the same context and arguments
                return originalMethod.apply(this, args);
            });
        };
        
        // Apply the original Cron decorator to handle scheduling
        return Cron(cronTime, options)(target, propertyKey, descriptor);
    };
}

export { NonConcurrentCron };
import { performance } from 'perf_hooks';
import { Logger } from '@nestjs/common';

function Profile(): MethodDecorator {
  return function(target, propertyKey, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const logger = new Logger(target.constructor.name);
    descriptor.value = async function(...args: any[]) {
      const name = `${String(propertyKey)}`;
      const start = performance.now();

      const result = await originalMethod.apply(this, args);

      const end = performance.now();
      const duration = (end - start).toFixed(2);
      logger.warn(`[${name}] executed in ${duration} ms`);

      return result;
    };

    return descriptor;
  };
}

export { Profile };

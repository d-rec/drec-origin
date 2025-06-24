import { performance } from 'perf_hooks';
import { Logger } from '@nestjs/common';


function Profile(): MethodDecorator {
  return function(target, propertyKey, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const logger = new Logger(target.constructor.name);
    const isAsync = originalMethod.constructor.name === 'AsyncFunction';

    const logPerformance = (name: string, start: number) => {
      const end = performance.now();
      const duration = (end - start).toFixed(2);
      logger.warn(`${name}: Executed in ${duration} ms`);
    };

    descriptor.value = function(...args: any[]) {
      const name = `${String(propertyKey)}`;
      const start = performance.now();

      if(!isAsync){
        const result = originalMethod.apply(this, args);
        logPerformance(name, start);
        return result;
      }

      return originalMethod.apply(this, args).then((result: any) => {
        logPerformance(name, start);
        return result;
      });
    };

    return descriptor;
  };
}

export { Profile };

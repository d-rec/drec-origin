import { BullModule } from '@nestjs/bull';
import { DynamicModule } from '@nestjs/common';

export const registerQueues = (...queues: string[]): DynamicModule => {
  return BullModule.registerQueue(
    ...queues.map((queue) => ({
      name: queue,
    })),
  );
};

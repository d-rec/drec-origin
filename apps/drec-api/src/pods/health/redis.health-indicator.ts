import { Injectable, Scope } from '@nestjs/common';
import {
  HealthCheckError,
  HealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { createClient } from 'redis';

export interface Dog {
  name: string;
  type: string;
}

@Injectable({
  scope: Scope.TRANSIENT,
})
export class RedisHealthIndicator extends HealthIndicator {
  async pingCheck(key: string, url: string): Promise<HealthIndicatorResult> {
    let isHealthy = false;

    try {
      const client = createClient({
        url,
      });
      await client.connect();
      await client.ping();
      isHealthy = true;
      await client.disconnect();
    } catch (error) {
      throw new HealthCheckError(error.code, this.getStatus(key, false, error));
    }

    return this.getStatus(key, isHealthy);
  }
}

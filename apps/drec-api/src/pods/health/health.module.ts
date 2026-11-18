import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { RedisHealthIndicator } from './redis.health-indicator';
import { IssuanceWorkerHealthIndicator } from './issuance-worker.health-indicator';

@Module({
  imports: [TerminusModule],
  providers: [RedisHealthIndicator, IssuanceWorkerHealthIndicator],
  controllers: [HealthController],
})
export class HealthModule {}

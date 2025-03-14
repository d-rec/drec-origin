import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  DiskHealthIndicator,
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  HttpHealthIndicator,
  MemoryHealthIndicator,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { redisOptions } from '../../drec.module';
import { influxDBConfig } from '../../lib/influx-db';
import { RedisHealthIndicator } from './redis.health-indicator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private readonly disk: DiskHealthIndicator,
    private memory: MemoryHealthIndicator,
    private db: TypeOrmHealthIndicator,
    private redis: RedisHealthIndicator,
    private http: HttpHealthIndicator,
  ) {}

  @Get()
  @ApiOperation({
    description:
      'Checks if all the core services of the application are healthy',
  })
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      () =>
        this.disk.checkStorage('storage', { path: '/', thresholdPercent: 0.9 }),
      //   The process should not use more than 1024MB memory
      () => this.memory.checkHeap('memory_heap', 2048 * 1024 * 1024),
      () => this.db.pingCheck('database'),
      () =>
        this.redis.pingCheck(
          'redis',
          `redis://${redisOptions.host}:${redisOptions.port}`,
        ),
      () => this.http.pingCheck('influx-db', `${influxDBConfig.url}/health`),
    ]);
  }
}

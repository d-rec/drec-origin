import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  HttpHealthIndicator,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
// import { redisOptions } from '../../drec.module';
import { influxDBConfig } from '../../lib/influx-db';
import { RedisHealthIndicator } from './redis.health-indicator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    // private redis: RedisHealthIndicator,
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
      () => this.db.pingCheck('database'),
      // () =>
      //   this.redis.pingCheck(
      //     'redis',
      //     `redis://${redisOptions.host}:${redisOptions.port}`,
      //   ),
      () => this.http.pingCheck('influx-db', `${influxDBConfig.url}/health`),
    ]);
  }
}

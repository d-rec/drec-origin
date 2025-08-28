import { Controller, Get, HttpStatus } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  HttpHealthIndicator,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { redisOptions } from '../../drec.module';
import { RedisHealthIndicator } from './redis.health-indicator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private redis: RedisHealthIndicator,
    private http: HttpHealthIndicator,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Check',
    description: 'Return success when the application is up and running.',
  })
  @ApiOkResponse({
    description: 'The Health Check is successful',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'The Health Check is not successful',
  })
  check(): string {
    return 'ok';
  }

  @Get('/status')
  @ApiOperation({
    summary: 'Status',
    description:
      'Checks if all the core services of the application are healthy',
  })
  @HealthCheck()
  status(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () =>
        this.redis.pingCheck(
          'redis',
          `redis://${redisOptions.host}:${redisOptions.port}`,
        ),
    ]);
  }
}

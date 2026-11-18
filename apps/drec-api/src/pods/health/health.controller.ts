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
import { IssuanceWorkerHealthIndicator } from './issuance-worker.health-indicator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private redis: RedisHealthIndicator,
    private http: HttpHealthIndicator,
    private issuanceWorker: IssuanceWorkerHealthIndicator,
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

  @Get('/issuance-worker')
  @ApiOperation({
    summary: 'Issuance worker liveness',
    description:
      'Returns 503 when the late-ongoing BullMQ mint worker has stalled ' +
      '(pending cycles exist but no cycle has been checked for >9h). Intended ' +
      'as a k8s livenessProbe target so a stuck worker triggers an automatic ' +
      'pod restart — the proven remedy for the ioredis connection-drop stall.',
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'The late-ongoing issuance worker appears stalled',
  })
  @HealthCheck()
  issuanceWorkerLiveness(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.issuanceWorker.isHealthy('issuance_worker'),
    ]);
  }
}

import { Injectable } from '@nestjs/common';
import {
  HealthCheckError,
  HealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import {
  LATE_ONGOING_WORKER_HEALTH_SQL,
  LateOngoingWorkerHealthRow,
  evaluateLateOngoingWorkerHealth,
} from '../issuer/services/late-ongoing-worker-health';

/**
 * Terminus indicator that goes unhealthy when the late-ongoing BullMQ mint
 * worker has stalled (pending cycles but no progress for >9h). Wire the
 * /health/issuance-worker endpoint as a k8s livenessProbe so a stuck worker
 * triggers an automatic pod restart — the proven remedy for the ioredis
 * connection-drop stall (see late-ongoing-worker-health.ts).
 *
 * Queries the DB directly rather than depending on IssuerModule, to avoid
 * coupling HealthModule to the issuer graph; the stall logic itself is shared.
 */
@Injectable()
export class IssuanceWorkerHealthIndicator extends HealthIndicator {
  constructor(@InjectConnection() private readonly connection: Connection) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const [row] = (await this.connection.query(
      LATE_ONGOING_WORKER_HEALTH_SQL,
    )) as LateOngoingWorkerHealthRow[];

    const health = evaluateLateOngoingWorkerHealth(row, Date.now());

    const result = this.getStatus(key, !health.stalled, {
      pending: health.pending,
      lastCheckedAt: health.lastChecked,
      ageHours: health.ageHours,
    });

    if (health.stalled) {
      throw new HealthCheckError(
        `late-ongoing issuance worker stalled: ${health.reason}`,
        result,
      );
    }

    return result;
  }
}

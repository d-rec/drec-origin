import { Injectable, Logger } from '@nestjs/common';
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
 * worker has stalled (pending cycles but no progress for >9h). Point a k8s
 * livenessProbe at the /health/issuance-worker endpoint so a stuck worker
 * triggers an automatic pod restart — the proven remedy for the ioredis
 * connection-drop stall (see late-ongoing-worker-health.ts).
 *
 * Queries the DB directly rather than depending on IssuerModule, to avoid
 * coupling HealthModule to the issuer graph; the stall logic itself is shared.
 *
 * FAILS OPEN on query error. This endpoint is intended for the liveness path,
 * where the existing container already has exactly one livenessProbe — so
 * repointing it here means a DB query now sits on the restart path. We must
 * only restart on POSITIVE evidence of a stalled worker (DB reachable AND
 * cycles pending AND stale). If the query itself throws (DB briefly
 * unreachable), returning unhealthy would restart every api pod in a cascade
 * during a DB incident. So an errored/inconclusive check reports healthy.
 */
@Injectable()
export class IssuanceWorkerHealthIndicator extends HealthIndicator {
  private readonly logger = new Logger(IssuanceWorkerHealthIndicator.name);

  constructor(@InjectConnection() private readonly connection: Connection) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    let row: LateOngoingWorkerHealthRow;
    try {
      [row] = (await this.connection.query(
        LATE_ONGOING_WORKER_HEALTH_SQL,
      )) as LateOngoingWorkerHealthRow[];
    } catch (err) {
      // Fail open: an unreachable DB is not evidence of a stalled worker, and
      // must never cascade into a restart loop. The DB's own health check
      // (/health/status) is the right place to surface DB outages.
      this.logger.error(
        `issuance-worker liveness check could not query cycles, reporting healthy: ${
          (err as Error).message
        }`,
      );
      return this.getStatus(key, true, { checkSkipped: true });
    }

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

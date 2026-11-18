/**
 * Shared stall-detection logic for the late-ongoing BullMQ mint worker.
 *
 * Used by two callers that must agree on what "stalled" means:
 *  - LateOngoingIssuanceService.monitorIssuanceWorkerHealth (30-min cron → log + Sentry)
 *  - IssuanceWorkerHealthIndicator (Terminus → 503 → k8s livenessProbe → pod restart)
 *
 * Background: on 2026-07-28 the prod api pod crashed on an ioredis
 * "Connection is closed" and restarted, but the BullMQ worker came back dead.
 * processIssuance minted nothing for ~5.5 days while createMissingCycles (not
 * queue-bound) kept piling up cycles. The detector added in #778 caught it but
 * only logged "restart the api pod to recover" — nobody saw the log. This helper
 * lets a k8s livenessProbe act on the same signal automatically.
 */

/**
 * How stale the newest checked_at may get before we call the worker stalled.
 * One 8-hour scheduleIssuance interval + 1h margin. The worker should touch a
 * cycle within seconds of each cron, so 9h of silence with pending work means
 * it has stopped consuming.
 */
export const LATE_ONGOING_WORKER_STALE_AFTER_MS = 9 * 60 * 60 * 1000;

/** Aggregate over the cycle table: how much work is pending and when a cycle was last touched. */
export const LATE_ONGOING_WORKER_HEALTH_SQL = `SELECT
   COUNT(*) FILTER (WHERE certificate_issued=false AND archived_at IS NULL) AS pending,
   MAX(checked_at) AS last_checked
 FROM device_lateongoing_certificate_cycle`;

export interface LateOngoingWorkerHealthRow {
  pending: string | number;
  last_checked: Date | string | null;
}

export interface LateOngoingWorkerHealth {
  pending: number;
  lastChecked: Date | null;
  ageMs: number | null;
  ageHours: number | null;
  stalled: boolean;
  /** Human-readable reason, present only when stalled. */
  reason?: string;
}

/**
 * Pure evaluation of the aggregate row against the staleness threshold.
 * `now` is injected so this is deterministic and unit-testable.
 */
export function evaluateLateOngoingWorkerHealth(
  row: LateOngoingWorkerHealthRow,
  now: number,
): LateOngoingWorkerHealth {
  const pending = Number(row.pending);

  // No pending work → nothing for the worker to do → not stalled by definition.
  if (!pending) {
    return {
      pending: 0,
      lastChecked: null,
      ageMs: null,
      ageHours: null,
      stalled: false,
    };
  }

  // Pending work but no cycle has ever been checked → worker likely never ran.
  if (!row.last_checked) {
    return {
      pending,
      lastChecked: null,
      ageMs: null,
      ageHours: null,
      stalled: true,
      reason:
        'pending cycles exist but no cycle has ever been checked — worker may not be running',
    };
  }

  const lastChecked = new Date(row.last_checked);
  const ageMs = now - lastChecked.getTime();
  const ageHours = Number((ageMs / 1000 / 3600).toFixed(1));
  const stalled = ageMs > LATE_ONGOING_WORKER_STALE_AFTER_MS;

  return {
    pending,
    lastChecked,
    ageMs,
    ageHours,
    stalled,
    reason: stalled
      ? `${pending} pending cycle(s), last checked_at ${ageHours}h ago ` +
        `(threshold ${LATE_ONGOING_WORKER_STALE_AFTER_MS / 1000 / 3600}h)`
      : undefined,
  };
}

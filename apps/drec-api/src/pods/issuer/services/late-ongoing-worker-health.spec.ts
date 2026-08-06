import {
  LATE_ONGOING_WORKER_STALE_AFTER_MS,
  evaluateLateOngoingWorkerHealth,
} from './late-ongoing-worker-health';

describe('evaluateLateOngoingWorkerHealth', () => {
  const now = new Date('2026-08-06T12:00:00.000Z').getTime();
  const hoursAgo = (h: number) => new Date(now - h * 3600 * 1000);

  it('is healthy when there is no pending work, regardless of staleness', () => {
    const h = evaluateLateOngoingWorkerHealth(
      { pending: 0, last_checked: hoursAgo(999) },
      now,
    );
    expect(h.stalled).toBe(false);
    expect(h.pending).toBe(0);
  });

  it('is healthy when pending work was checked recently', () => {
    const h = evaluateLateOngoingWorkerHealth(
      { pending: 500, last_checked: hoursAgo(1) },
      now,
    );
    expect(h.stalled).toBe(false);
    expect(h.ageHours).toBeCloseTo(1, 1);
  });

  it('is stalled when pending work has not been checked past the threshold', () => {
    const h = evaluateLateOngoingWorkerHealth(
      { pending: 748843, last_checked: hoursAgo(131.2) },
      now,
    );
    expect(h.stalled).toBe(true);
    expect(h.pending).toBe(748843);
    expect(h.reason).toContain('748843 pending');
    expect(h.reason).toContain('131.2h ago');
  });

  it('is stalled when pending work exists but nothing was ever checked', () => {
    const h = evaluateLateOngoingWorkerHealth(
      { pending: 10, last_checked: null },
      now,
    );
    expect(h.stalled).toBe(true);
    expect(h.reason).toContain('ever been checked');
  });

  it('treats the threshold boundary as not-yet-stalled', () => {
    const h = evaluateLateOngoingWorkerHealth(
      {
        pending: 1,
        last_checked: new Date(now - LATE_ONGOING_WORKER_STALE_AFTER_MS),
      },
      now,
    );
    expect(h.stalled).toBe(false);
  });

  it('accepts string aggregates from the raw pg driver', () => {
    const h = evaluateLateOngoingWorkerHealth(
      { pending: '5', last_checked: hoursAgo(20).toISOString() },
      now,
    );
    expect(h.pending).toBe(5);
    expect(h.stalled).toBe(true);
  });
});

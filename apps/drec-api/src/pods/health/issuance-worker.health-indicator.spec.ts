import { HealthCheckError } from '@nestjs/terminus';
import { Connection } from 'typeorm';
import { IssuanceWorkerHealthIndicator } from './issuance-worker.health-indicator';

describe('IssuanceWorkerHealthIndicator', () => {
  const build = (query: jest.Mock) =>
    new IssuanceWorkerHealthIndicator({ query } as unknown as Connection);

  const hoursAgoIso = (h: number) =>
    new Date(Date.now() - h * 3600 * 1000).toISOString();

  it('reports healthy when the worker is progressing', async () => {
    const indicator = build(
      jest
        .fn()
        .mockResolvedValue([{ pending: '100', last_checked: hoursAgoIso(1) }]),
    );
    const res = await indicator.isHealthy('issuance_worker');
    expect(res.issuance_worker.status).toBe('up');
  });

  it('throws HealthCheckError (→ 503) when the worker is stalled', async () => {
    const indicator = build(
      jest
        .fn()
        .mockResolvedValue([
          { pending: '748843', last_checked: hoursAgoIso(131) },
        ]),
    );
    await expect(indicator.isHealthy('issuance_worker')).rejects.toBeInstanceOf(
      HealthCheckError,
    );
  });

  it('FAILS OPEN (healthy) when the cycle query throws — no restart cascade on DB blips', async () => {
    const indicator = build(
      jest.fn().mockRejectedValue(new Error('connection terminated')),
    );
    const res = await indicator.isHealthy('issuance_worker');
    expect(res.issuance_worker.status).toBe('up');
    expect(res.issuance_worker.checkSkipped).toBe(true);
  });
});

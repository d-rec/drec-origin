import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { providers } from 'ethers';
import { SyncQuarantineRecoveryService } from './sync-quarantine-recovery.service';

// We stub ethers.providers.JsonRpcProvider so tests run without a real node.
jest.mock('ethers', () => {
  const actual = jest.requireActual<typeof import('ethers')>('ethers');
  return {
    ...actual,
    providers: {
      ...actual.providers,
      JsonRpcProvider: jest.fn(),
    },
  };
});

const MockedJsonRpcProvider = providers.JsonRpcProvider as jest.MockedClass<
  typeof providers.JsonRpcProvider
>;

describe('SyncQuarantineRecoveryService', () => {
  let service: SyncQuarantineRecoveryService;
  let dataSource: jest.Mocked<Pick<DataSource, 'query'>>;

  beforeEach(async () => {
    dataSource = { query: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncQuarantineRecoveryService,
        {
          provide: getDataSourceToken(),
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get(SyncQuarantineRecoveryService);

    // Default env — 8 attempts, valid WEB3 URL
    process.env.WEB3 = 'https://volta-rpc.energyweb.org';
    process.env.MAX_SYNCHRONIZATION_ATTEMPTS_FOR_EVENT = '8';
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.WEB3;
    delete process.env.MAX_SYNCHRONIZATION_ATTEMPTS_FOR_EVENT;
  });

  // -----------------------------------------------------------------------
  // isChainReachable
  // -----------------------------------------------------------------------

  describe('isChainReachable()', () => {
    it('returns true when eth_blockNumber resolves', async () => {
      MockedJsonRpcProvider.mockImplementationOnce(
        () =>
          ({
            getBlockNumber: jest.fn().mockResolvedValue(12345),
          }) as any,
      );

      const reachable = await service.isChainReachable();

      expect(reachable).toBe(true);
    });

    it('returns false when eth_blockNumber rejects (simulates outage)', async () => {
      MockedJsonRpcProvider.mockImplementationOnce(
        () =>
          ({
            getBlockNumber: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')),
          }) as any,
      );

      const reachable = await service.isChainReachable();

      expect(reachable).toBe(false);
    });

    it('returns true and logs a warning when WEB3 env var is absent', async () => {
      delete process.env.WEB3;

      const reachable = await service.isChainReachable();

      expect(reachable).toBe(true);
      // No provider should have been constructed.
      expect(MockedJsonRpcProvider).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // resetQuarantinedRows
  // -----------------------------------------------------------------------

  describe('resetQuarantinedRows()', () => {
    it('executes UPDATE with the configured maxAttempts threshold', async () => {
      // pg-style: [rows, rowCount]
      dataSource.query.mockResolvedValue([[], 3]);

      const affected = await service.resetQuarantinedRows();

      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE certificate_synchronization_attempt'),
        [8],
      );
      expect(affected).toBe(3);
    });

    it('returns 0 when no rows are quarantined', async () => {
      dataSource.query.mockResolvedValue([[], 0]);

      const affected = await service.resetQuarantinedRows();

      expect(affected).toBe(0);
    });

    it('resets using the env-configured max attempts value', async () => {
      process.env.MAX_SYNCHRONIZATION_ATTEMPTS_FOR_EVENT = '5';

      // Re-create module so the constructor picks up the new env value.
      const m = await Test.createTestingModule({
        providers: [
          SyncQuarantineRecoveryService,
          { provide: getDataSourceToken(), useValue: dataSource },
        ],
      }).compile();

      const svc = m.get(SyncQuarantineRecoveryService);
      dataSource.query.mockResolvedValue([[], 1]);

      await svc.resetQuarantinedRows();

      expect(dataSource.query).toHaveBeenCalledWith(
        expect.any(String),
        [5], // threshold from env
      );
    });
  });

  // -----------------------------------------------------------------------
  // recoverQuarantinedEvents (the full sweep)
  // -----------------------------------------------------------------------

  describe('recoverQuarantinedEvents()', () => {
    it('resets quarantined rows when the chain is reachable', async () => {
      MockedJsonRpcProvider.mockImplementationOnce(
        () =>
          ({
            getBlockNumber: jest.fn().mockResolvedValue(99),
          }) as any,
      );
      // Simulate 45 quarantined rows (the April-2026 incident count).
      dataSource.query.mockResolvedValue([[], 45]);

      await service.recoverQuarantinedEvents();

      expect(dataSource.query).toHaveBeenCalledTimes(1);
    });

    it('skips the reset when the chain is unreachable', async () => {
      MockedJsonRpcProvider.mockImplementationOnce(
        () =>
          ({
            getBlockNumber: jest.fn().mockRejectedValue(new Error('timeout')),
          }) as any,
      );

      await service.recoverQuarantinedEvents();

      // No DB write should happen during an active outage.
      expect(dataSource.query).not.toHaveBeenCalled();
    });

    it('makes events eligible again after quarantine is reset', async () => {
      // Step 1 – outage: chain is down, sweep skips reset.
      MockedJsonRpcProvider.mockImplementationOnce(
        () =>
          ({
            getBlockNumber: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')),
          }) as any,
      );
      await service.recoverQuarantinedEvents();
      expect(dataSource.query).not.toHaveBeenCalled();

      // Step 2 – recovery: chain comes back, sweep resets quarantined rows.
      MockedJsonRpcProvider.mockImplementationOnce(
        () =>
          ({
            getBlockNumber: jest.fn().mockResolvedValue(200),
          }) as any,
      );
      dataSource.query.mockResolvedValue([[], 45]);

      await service.recoverQuarantinedEvents();

      expect(dataSource.query).toHaveBeenCalledTimes(1);
      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('attempts_count = 0'),
        expect.any(Array),
      );
    });
  });
});

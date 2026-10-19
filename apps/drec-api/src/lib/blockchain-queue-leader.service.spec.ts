import { ModuleRef } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { BlockchainQueueLeaderService } from './blockchain-queue-leader.service';

const redis = {
  eval: jest.fn(),
  set: jest.fn(),
  quit: jest.fn().mockResolvedValue('OK'),
};

jest.mock('./redis', () => ({
  getRedisClient: () => redis,
}));

describe('BlockchainQueueLeaderService', () => {
  let service: BlockchainQueueLeaderService;

  const queue = (name: string) => ({
    name,
    pause: jest.fn().mockResolvedValue(undefined),
    resume: jest.fn().mockResolvedValue(undefined),
  });

  let actions: ReturnType<typeof queue>;
  let synchronize: ReturnType<typeof queue>;

  /** Renewal fails (we don't hold it yet), acquisition decides the outcome. */
  const acquisition = (won: boolean) => {
    redis.eval.mockResolvedValue(0);
    redis.set.mockResolvedValue(won ? 'OK' : null);
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    actions = queue('blockchain-actions');
    synchronize = queue('blockchain-synchronize');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlockchainQueueLeaderService,
        {
          provide: ModuleRef,
          useValue: {
            get: (token: string) =>
              String(token).includes('blockchain-actions')
                ? actions
                : synchronize,
          } as any,
        },
      ],
    }).compile();

    service = module.get(BlockchainQueueLeaderService);
  });

  it('pauses both queues before the first election', async () => {
    acquisition(false);
    await service.onApplicationBootstrap();

    // pause(true) — local, and without doNotWaitActive.
    expect(actions.pause).toHaveBeenCalledWith(true);
    expect(synchronize.pause).toHaveBeenCalledWith(true);
  });

  it('resumes both queues on the replica that wins', async () => {
    acquisition(true);
    await service.onApplicationBootstrap();

    expect(service.leader).toBe(true);
    expect(actions.resume).toHaveBeenCalledWith(true);
    expect(synchronize.resume).toHaveBeenCalledWith(true);
  });

  it('leaves a losing replica paused and never resumes it', async () => {
    acquisition(false);
    await service.onApplicationBootstrap();

    expect(service.leader).toBe(false);
    expect(actions.resume).not.toHaveBeenCalled();
    expect(synchronize.resume).not.toHaveBeenCalled();
  });

  it('renews without re-acquiring, and does not re-resume', async () => {
    acquisition(true);
    await service.onApplicationBootstrap();
    redis.set.mockClear();
    actions.resume.mockClear();

    redis.eval.mockResolvedValue(1); // still ours
    await (service as any).elect();

    expect(service.leader).toBe(true);
    expect(redis.set).not.toHaveBeenCalled();
    expect(actions.resume).not.toHaveBeenCalled();
  });

  it('pauses again when leadership is lost mid-run', async () => {
    acquisition(true);
    await service.onApplicationBootstrap();
    actions.pause.mockClear();
    synchronize.pause.mockClear();

    // Renewal rejected and the key now belongs to someone else.
    redis.eval.mockResolvedValue(0);
    redis.set.mockResolvedValue(null);
    await (service as any).elect();

    expect(service.leader).toBe(false);
    expect(actions.pause).toHaveBeenCalledWith(true);
    expect(synchronize.pause).toHaveBeenCalledWith(true);
  });

  it('releases leadership on shutdown so the next replica need not wait out the TTL', async () => {
    acquisition(true);
    await service.onApplicationBootstrap();
    redis.eval.mockClear();

    await service.onApplicationShutdown();

    expect(redis.eval).toHaveBeenCalled();
    expect(redis.quit).toHaveBeenCalled();
  });

  it('disables itself when no blockchain queue is registered', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlockchainQueueLeaderService,
        {
          provide: ModuleRef,
          useValue: {
            get: () => {
              throw new Error('not registered');
            },
          } as any,
        },
      ],
    }).compile();

    const bare = module.get(BlockchainQueueLeaderService);
    await bare.onApplicationBootstrap();

    expect(bare.leader).toBe(false);
    expect(redis.set).not.toHaveBeenCalled();
  });
});

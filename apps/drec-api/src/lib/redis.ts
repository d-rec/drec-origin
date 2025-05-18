import Redis from 'ioredis';

export const getRedisClient = (): Redis => {
  return new Redis({
    host: process.env.REDIS_URL ?? 'localhost',
    port: Number(process.env.REDIS_PORT ?? 6379),
  });
};

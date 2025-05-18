import Redis from 'ioredis';
import { redisOptions } from '../drec.module';

export const getRedisClient = (): Redis  => {
    return new Redis({
      host: redisOptions.host, // Redis server host
      port: redisOptions.port,        // Redis server port
    });
}
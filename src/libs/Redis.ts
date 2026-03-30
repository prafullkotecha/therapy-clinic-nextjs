import { createClient } from 'redis';
import { Env } from './Env';

const globalForRedis = globalThis as unknown as {
  redisClient: ReturnType<typeof createClient> | undefined;
};

const createRedisClient = () => {
  return createClient({
    url: Env.REDIS_URL,
  });
};

const redis = globalForRedis.redisClient ?? createRedisClient();

if (Env.NODE_ENV !== 'production') {
  globalForRedis.redisClient = redis;
}

export { redis };

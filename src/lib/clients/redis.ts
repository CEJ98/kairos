import { Redis } from '@upstash/redis';

type RedisClient = Redis;

let client: RedisClient | null = null;

export function getRedisClient(): RedisClient {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error('Upstash Redis credentials are missing');
  }

  if (!client) {
    client = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN
    });
  }

  return client;
}

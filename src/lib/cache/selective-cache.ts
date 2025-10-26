import { getRedisClient } from '@/lib/clients/redis';

type RedisLike = {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: string, opts?: { ex?: number }): Promise<void>;
  del(key: string): Promise<void>;
};

const memory = new Map<string, string>();

function getSafeRedis(): RedisLike {
  try {
    const client = getRedisClient();
    return {
      get: async <T>(key: string) => (await client.get<T>(key)) ?? null,
      set: async (key: string, value: string, opts?: { ex?: number }) => {
        if (typeof opts?.ex === 'number') {
          await client.set(
            key,
            value,
            { ex: opts.ex } as unknown as Parameters<typeof client.set>[2]
          );
        } else {
          await client.set(key, value);
        }
      },
      del: async (key: string) => {
        await client.del(key);
      }
    } as RedisLike;
  } catch {
    return {
      get: async <T>(key: string) => {
        const raw = memory.get(key);
        return raw ? (JSON.parse(raw) as T) : null;
      },
      set: async (key: string, value: string) => {
        memory.set(key, value);
      },
      del: async (key: string) => {
        memory.delete(key);
      }
    } as RedisLike;
  }
}

const redis = getSafeRedis();

export async function cacheGet<T>(key: string): Promise<T | null> {
  const raw = await redis.get<string>(key);
  return raw ? (JSON.parse(raw) as T) : null;
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds = 60) {
  if (ttlSeconds <= 0) {
    await redis.del(key);
    return;
  }
  await redis.set(key, JSON.stringify(value), { ex: ttlSeconds });
}

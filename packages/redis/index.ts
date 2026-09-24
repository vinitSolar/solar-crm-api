import { Redis } from "ioredis";
import { env } from "../config/env.js";
import { logger } from "../logger/index.js";

/** Maximum retry delay for ioredis reconnection (10 seconds) */
const MAX_RETRY_DELAY_MS = 10_000;

/** Throttle error logging: only log Redis offline notice once per 15 minutes */
let lastRedisErrorLog = 0;
const ERROR_LOG_THROTTLE_MS = 15 * 60_000;

const redisClient = new Redis({
    host: env.REDIS.HOST,
    port: env.REDIS.PORT,
    password: env.REDIS.PASSWORD,
    lazyConnect: true,
    enableOfflineQueue: false, // Don't queue commands indefinitely if Redis goes down
    commandTimeout: 2000,      // Fail fast after 2 seconds so fallback can take over
    maxRetriesPerRequest: null,
    retryStrategy: (times: number) => {
        if (times > 5) {
            // Once Redis is confirmed offline, back off retry interval to 30s
            return 30_000;
        }
        const delay = Math.min(times * 1000, MAX_RETRY_DELAY_MS);
        return delay;
    },
});

redisClient.on("connect", () => {
    logger.info("Redis connected successfully");
});

redisClient.on("error", (error: any) => {
    const now = Date.now();
    if (now - lastRedisErrorLog >= ERROR_LOG_THROTTLE_MS) {
        lastRedisErrorLog = now;
        const msg = error?.message || error?.code || "Connection refused";
        logger.warn(`Redis is offline (${msg}). Safe database fallback is active.`);
    }
});

export async function connectRedis(): Promise<void> {
    try {
        if (redisClient.status === "wait") {
            await redisClient.connect();
        }
    } catch (error: any) {
        logger.warn(`Redis initial connection attempt failed: ${error?.message || error}. Fallback strategies will be used.`);
    }
}

export async function closeRedisConnection() {
    await redisClient.quit();
}

/**
 * Safely retrieves and JSON-parses a cached value from Redis.
 * If Redis is offline, disconnected, or throws, returns null (never throws).
 */
export async function safeCacheGet<T>(key: string): Promise<T | null> {
    try {
        if (redisClient.status !== "ready") return null;
        const data = await redisClient.get(key);
        if (!data) return null;
        return JSON.parse(data) as T;
    } catch {
        return null;
    }
}

/**
 * Safely serializes and sets a value in Redis with a TTL in seconds.
 * Fails silently if Redis is offline or throws (never throws).
 */
export async function safeCacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    try {
        if (redisClient.status !== "ready") return;
        const serialized = JSON.stringify(value);
        await redisClient.setex(key, ttlSeconds, serialized);
    } catch {
        // Silently ignore caching errors to preserve uptime
    }
}

/**
 * Safely deletes one or more keys from Redis.
 * Fails silently if Redis is offline (never throws).
 */
export async function safeCacheDel(...keys: string[]): Promise<void> {
    try {
        if (redisClient.status !== "ready" || keys.length === 0) return;
        await redisClient.del(...keys);
    } catch {
        // Silently ignore deletion errors
    }
}

/**
 * Safely deletes all keys matching a pattern using SCAN.
 * Non-blocking, fails silently if Redis is offline.
 */
export async function safeCacheDelPattern(pattern: string): Promise<void> {
    try {
        if (redisClient.status !== "ready") return;
        const stream = redisClient.scanStream({ match: pattern, count: 50 });
        stream.on("data", async (keys: string[]) => {
            if (keys && keys.length > 0) {
                await redisClient.del(...keys).catch(() => {});
            }
        });
    } catch {
        // Silently ignore scan errors
    }
}

/**
 * Robust Cache-Aside helper.
 * 1. Checks Redis cache.
 * 2. On cache miss or Redis failure, executes fetcher() from PostgreSQL.
 * 3. Asynchronously writes to Redis in background.
 * 4. NEVER throws on Redis errors; business operations always succeed.
 */
export async function getOrSetCache<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<T> {
    const cached = await safeCacheGet<T>(key);
    if (cached !== null) {
        return cached;
    }

    const data = await fetcher();

    if (data !== undefined && data !== null) {
        safeCacheSet(key, data, ttlSeconds).catch(() => {});
    }

    return data;
}

export { redisClient };



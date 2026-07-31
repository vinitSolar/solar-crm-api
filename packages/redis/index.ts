import { Redis } from "ioredis";
import { env } from "../config/env.js";
import { logger } from "../logger/index.js";

/** Maximum retry delay for ioredis reconnection (10 seconds) */
const MAX_RETRY_DELAY_MS = 10_000;

/** Throttle error logging: only log Redis errors once per 60 seconds */
let lastRedisErrorLog = 0;
const ERROR_LOG_THROTTLE_MS = 60_000;

const redisClient = new Redis({
    host: env.REDIS.HOST,
    port: env.REDIS.PORT,
    password: env.REDIS.PASSWORD,
    lazyConnect: true,
    maxRetriesPerRequest: null,
    retryStrategy: (times: number) => {
        const delay = Math.min(times * 500, MAX_RETRY_DELAY_MS);
        return delay;
    },
});

redisClient.on("connect", () => {
    logger.info("Redis connected");
});

redisClient.on("error", (error) => {
    const now = Date.now();
    if (now - lastRedisErrorLog >= ERROR_LOG_THROTTLE_MS) {
        lastRedisErrorLog = now;
        logger.error(`Redis Connection Error: ${error.message}`);
    }
});

export async function closeRedisConnection() {
    await redisClient.quit();
}

export { redisClient };

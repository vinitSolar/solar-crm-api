import { Redis } from "ioredis";
import { env } from "../config/env.js";
import { logger } from "../logger/index.js";

const redisClient = new Redis({
    host: env.REDIS.HOST,
    port: env.REDIS.PORT,
    password: env.REDIS.PASSWORD,
    lazyConnect: true,
    retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
});

redisClient.on("connect", () => {
    logger.info("Redis connected");
});

redisClient.on("error", (error) => {
    logger.error("Redis Connection Error", error);
});

export async function closeRedisConnection() {
    await redisClient.quit();
}

export { redisClient };

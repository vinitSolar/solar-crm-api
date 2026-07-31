/**
 * Notification Module — Redis Health Helper
 *
 * Lightweight health check for Redis availability.
 * Uses ioredis connection state (no expensive PING commands).
 * Results are cached for a configurable TTL to avoid checking on every request.
 */

import { redisClient } from "@packages/redis/index.js";
import { logger } from "@packages/logger/logger.js";
import { REDIS_HEALTH_CACHE_TTL_MS, NOTIFICATION_MESSAGES } from "../constants/notification.constants.js";

let cachedStatus: boolean = false;
let lastCheckTimestamp: number = 0;

/**
 * Checks whether Redis is available for BullMQ operations.
 *
 * Uses the ioredis client's `status` property to determine connectivity
 * without performing an additional network round-trip.
 *
 * The result is cached for REDIS_HEALTH_CACHE_TTL_MS milliseconds.
 *
 * @returns true if Redis is connected and ready, false otherwise
 */
export function isRedisAvailable(): boolean {
    const now = Date.now();

    // Return cached value if within TTL
    if (now - lastCheckTimestamp < REDIS_HEALTH_CACHE_TTL_MS) {
        return cachedStatus;
    }

    // Check ioredis connection state
    const status = redisClient.status;
    const available = status === "ready";

    if (available) {
        logger.debug(NOTIFICATION_MESSAGES.REDIS_AVAILABLE);
    } else {
        logger.warn(`${NOTIFICATION_MESSAGES.REDIS_UNAVAILABLE} (status: ${status})`);
    }

    cachedStatus = available;
    lastCheckTimestamp = now;

    return available;
}

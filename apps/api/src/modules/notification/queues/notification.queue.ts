/**
 * Notification Module — BullMQ Queue Definition
 *
 * Provides lazy access to the BullMQ notification queue.
 * The queue is only created on first use (when Redis is known to be available).
 * This prevents connection errors when Redis is offline at startup.
 */

import { Queue } from "bullmq";
import { env } from "@packages/config/index.js";
import { logger } from "@packages/logger/logger.js";
import { NOTIFICATION_QUEUE } from "../constants/notification.constants.js";

/** Redis connection options for BullMQ */
const redisConnection = {
    host: env.REDIS.HOST,
    port: env.REDIS.PORT,
    password: env.REDIS.PASSWORD || undefined,
    maxRetriesPerRequest: null
};

/** Lazy-initialized queue instance */
let queueInstance: Queue | null = null;

/**
 * Returns the BullMQ notification queue instance, creating it lazily on first call.
 * This avoids establishing a Redis connection at module import time.
 */
export function getNotificationQueue(): Queue {
    if (!queueInstance) {
        logger.info("Initializing BullMQ notification queue.");
        queueInstance = new Queue(NOTIFICATION_QUEUE.NAME, {
            connection: redisConnection,
            defaultJobOptions: {
                attempts: NOTIFICATION_QUEUE.DEFAULT_ATTEMPTS,
                backoff: {
                    type: NOTIFICATION_QUEUE.BACKOFF_TYPE,
                    delay: NOTIFICATION_QUEUE.BACKOFF_DELAY
                },
                removeOnComplete: {
                    count: 1000,
                    age: 24 * 60 * 60   // Keep completed jobs for 24 hours
                },
                removeOnFail: {
                    count: 5000,
                    age: 7 * 24 * 60 * 60  // Keep failed jobs for 7 days
                }
            }
        });
    }
    return queueInstance;
}

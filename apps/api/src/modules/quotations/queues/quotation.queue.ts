import { Queue } from "bullmq";
import { env } from "@packages/config/index.js";
import { logger } from "@packages/logger/logger.js";
import { QUOTATION_QUEUE } from "../constants/quotation.constants.js";

const redisConnection = {
    host: env.REDIS.HOST,
    port: env.REDIS.PORT,
    password: env.REDIS.PASSWORD || undefined,
    maxRetriesPerRequest: null
};

let queueInstance: Queue | null = null;

export function getQuotationQueue(): Queue {
    if (!queueInstance) {
        logger.info("Initializing BullMQ quotation snapshot queue.");
        queueInstance = new Queue(QUOTATION_QUEUE.NAME, {
            connection: redisConnection,
            defaultJobOptions: {
                attempts: QUOTATION_QUEUE.DEFAULT_ATTEMPTS,
                backoff: {
                    type: QUOTATION_QUEUE.BACKOFF_TYPE as "exponential" | "fixed",
                    delay: QUOTATION_QUEUE.BACKOFF_DELAY
                },
                removeOnComplete: {
                    count: 1000,
                    age: 24 * 60 * 60
                },
                removeOnFail: {
                    count: 5000,
                    age: 7 * 24 * 60 * 60
                }
            }
        });
    }
    return queueInstance;
}

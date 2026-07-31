/**
 * Notification Module — BullMQ Worker
 *
 * Processes notification jobs from the BullMQ queue.
 * Each job loads the template, compiles variables, sends via the appropriate
 * channel provider, and updates the notification log.
 *
 * The worker is stateless — no in-memory state between jobs.
 * Retry logic is handled by BullMQ's built-in backoff mechanism.
 *
 * The worker only starts if Redis is available at startup time.
 * If Redis is unavailable, the worker is NOT created — avoiding error spam.
 * The direct fallback dispatcher handles notifications in that case.
 */

import { Worker } from "bullmq";
import type { Job } from "bullmq";
import { env } from "@packages/config/index.js";
import { logger } from "@packages/logger/logger.js";
import { emailProvider } from "../providers/email.provider.js";
import { NotificationRepository } from "../repositories/notification.repository.js";
import {
    NOTIFICATION_CHANNEL,
    NOTIFICATION_STATUS,
    NOTIFICATION_QUEUE,
    NOTIFICATION_MESSAGES
} from "../constants/notification.constants.js";
import { getTemplateConfig, loadTemplateHtml, compileTemplate } from "../helpers/template.helper.js";
import { isRedisAvailable } from "../helpers/redis-health.helper.js";
import type { ISendNotificationPayload } from "../interfaces/notification.interfaces.js";

/** Shape of data stored in each BullMQ job */
interface INotificationJobData {
    payload: ISendNotificationPayload;
    logUid: string;
}

const repository = new NotificationRepository();

/**
 * Processes a single notification job.
 */
async function processNotificationJob(job: Job<INotificationJobData>): Promise<void> {
    const { payload, logUid } = job.data;

    logger.info(`Processing notification job [Job ID: ${job.id}, Log UID: ${logUid}, Template: ${payload.template}]`);

    // Update status to PROCESSING
    await repository.updateStatus(logUid, NOTIFICATION_STATUS.PROCESSING);

    // Route by channel
    switch (payload.channel) {
        case NOTIFICATION_CHANNEL.EMAIL:
            await processEmailNotification(payload);
            break;
        default:
            throw new Error(`Unsupported notification channel: ${payload.channel}`);
    }

    // Mark as SENT
    await repository.updateStatus(
        logUid,
        NOTIFICATION_STATUS.SENT,
        null,
        new Date()
    );

    logger.info(`${NOTIFICATION_MESSAGES.WORKER_JOB_COMPLETED} [Job ID: ${job.id}, Log UID: ${logUid}]`);
}

/**
 * Handles email channel: load template → compile → send via provider.
 */
async function processEmailNotification(payload: ISendNotificationPayload): Promise<void> {
    const templateConfig = getTemplateConfig(payload.template);

    const variables: Record<string, string> = {
        ...payload.variables,
        current_year: new Date().getFullYear().toString()
    };

    const subject = compileTemplate(templateConfig.subject, variables);
    const rawHtml = loadTemplateHtml(templateConfig.htmlPath);
    const html = compileTemplate(rawHtml, variables);

    await emailProvider.sendEmail(payload.recipient, subject, html);
}

/** Tracks whether the worker has been started */
let workerInstance: Worker<INotificationJobData> | null = null;

/** Throttle error logging: timestamp of the last logged worker error */
let lastErrorLogTimestamp = 0;
const ERROR_LOG_THROTTLE_MS = 60_000; // Only log worker errors once per minute

/**
 * Starts the BullMQ notification worker.
 * Should be called once during server startup.
 *
 * Fail-safe behavior:
 * - If Redis is unavailable at startup, the worker is NOT created (no error spam).
 * - The direct fallback dispatcher handles all notifications instead.
 * - Error events from the worker are throttled to prevent log flooding.
 */
export function startNotificationWorker(): void {
    try {
        // Check Redis availability before creating the worker
        if (!isRedisAvailable()) {
            logger.warn(`${NOTIFICATION_MESSAGES.WORKER_FAILED}: Redis is not available. Worker will not start. Direct fallback will be used for all notifications.`);
            return;
        }

        const redisConnection = {
            host: env.REDIS.HOST,
            port: env.REDIS.PORT,
            password: env.REDIS.PASSWORD || undefined,
            maxRetriesPerRequest: null
        };

        workerInstance = new Worker<INotificationJobData>(
            NOTIFICATION_QUEUE.NAME,
            processNotificationJob,
            {
                connection: redisConnection,
                concurrency: 5,
                limiter: {
                    max: 10,
                    duration: 1000
                }
            }
        );

        workerInstance.on("completed", (job) => {
            logger.info(`Notification worker: Job ${job?.id} completed successfully.`);
        });

        workerInstance.on("failed", async (job, error) => {
            const logUid = job?.data?.logUid;
            logger.error(`${NOTIFICATION_MESSAGES.WORKER_JOB_FAILED} [Job ID: ${job?.id}, Log UID: ${logUid}]: ${error.message}`);

            if (logUid) {
                try {
                    await repository.incrementRetryCount(logUid);

                    // If all attempts exhausted, mark as FAILED
                    if (job && job.attemptsMade >= (job.opts.attempts ?? NOTIFICATION_QUEUE.DEFAULT_ATTEMPTS)) {
                        await repository.updateStatus(
                            logUid,
                            NOTIFICATION_STATUS.FAILED,
                            error.message
                        );
                    }
                } catch (dbError) {
                    logger.error(`Failed to update notification log after worker job failure [Log UID: ${logUid}]`, dbError);
                }
            }
        });

        // Throttle error logging to prevent log flooding when Redis drops
        workerInstance.on("error", (error) => {
            const now = Date.now();
            if (now - lastErrorLogTimestamp >= ERROR_LOG_THROTTLE_MS) {
                lastErrorLogTimestamp = now;
                logger.error(`Notification worker connection error: ${error.message}`);
            }
        });

        logger.info(NOTIFICATION_MESSAGES.WORKER_STARTED);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        logger.warn(`${NOTIFICATION_MESSAGES.WORKER_FAILED}: ${message}. Direct fallback will be used.`);
    }
}

/**
 * Notification Module — BullMQ Dispatcher (Strategy)
 *
 * Dispatches notifications by adding jobs to the BullMQ queue.
 * The worker processes these jobs asynchronously.
 * Updates the notification log status to QUEUED after successful dispatch.
 */

import { logger } from "@packages/logger/logger.js";
import { getNotificationQueue } from "../queues/notification.queue.js";
import { NotificationRepository } from "../repositories/notification.repository.js";
import { NOTIFICATION_STATUS, NOTIFICATION_MESSAGES } from "../constants/notification.constants.js";
import type { ISendNotificationPayload, INotificationDispatcher } from "../interfaces/notification.interfaces.js";

export class BullMQDispatcher implements INotificationDispatcher {
    private readonly repository: NotificationRepository;

    constructor() {
        this.repository = new NotificationRepository();
    }

    /**
     * Adds a notification job to the BullMQ queue and updates the log to QUEUED.
     *
     * @param payload The notification payload
     * @param logUid  The notification log UID to update
     */
    async dispatch(payload: ISendNotificationPayload, logUid: string): Promise<void> {
        const jobName = `${payload.template}:${logUid}`;
        const queue = getNotificationQueue();

        await queue.add(jobName, {
            payload,
            logUid
        });

        await this.repository.updateStatus(
            logUid,
            NOTIFICATION_STATUS.QUEUED
        );

        logger.info(`${NOTIFICATION_MESSAGES.DISPATCH_BULLMQ} [Job: ${jobName}, Log UID: ${logUid}]`);
    }
}

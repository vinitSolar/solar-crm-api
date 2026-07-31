/**
 * Notification Module — Notification Service
 *
 * The ONLY public API for business modules.
 * Automatically selects BullMQ or Direct dispatch strategy based on Redis health.
 *
 * Business modules should call:
 *   notificationService.send({ ... })
 *
 * This method NEVER throws. It always returns { success: true, logUid }.
 * All errors are caught, logged, and the notification log is updated.
 */

import { logger } from "@packages/logger/logger.js";
import { NotificationRepository } from "../repositories/notification.repository.js";
import { BullMQDispatcher } from "../strategies/bullmq.dispatcher.js";
import { DirectDispatcher } from "../strategies/direct.dispatcher.js";
import { isRedisAvailable } from "../helpers/redis-health.helper.js";
import {
    NOTIFICATION_STATUS,
    DELIVERY_MODE,
    NOTIFICATION_MESSAGES
} from "../constants/notification.constants.js";
import type {
    ISendNotificationPayload,
    ISendNotificationResult
} from "../interfaces/notification.interfaces.js";

class NotificationService {
    private readonly repository: NotificationRepository;
    private readonly bullmqDispatcher: BullMQDispatcher;
    private readonly directDispatcher: DirectDispatcher;

    constructor() {
        this.repository = new NotificationRepository();
        this.bullmqDispatcher = new BullMQDispatcher();
        this.directDispatcher = new DirectDispatcher();
    }

    /**
     * Sends a notification through the appropriate dispatch strategy.
     *
     * Flow:
     * 1. Validate recipient
     * 2. Create notification log (status: PENDING)
     * 3. Check Redis health
     * 4. Dispatch via BullMQ (if Redis available) or Direct (fallback)
     * 5. Return { success: true, logUid }
     *
     * This method NEVER throws. Business transactions are never affected.
     *
     * @param payload Notification payload from the business module
     * @returns Result with success flag and log UID
     */
    async send(payload: ISendNotificationPayload): Promise<ISendNotificationResult> {
        let logUid = "";

        try {
            // 1. Validate recipient
            if (!payload.recipient || !payload.recipient.trim()) {
                logger.warn(`${NOTIFICATION_MESSAGES.RECIPIENT_EMPTY} [Module: ${payload.module}, Ref: ${payload.referenceUid}]`);
                return { success: false, logUid: "" };
            }

            // 2. Determine delivery mode
            const redisAvailable = isRedisAvailable();
            const deliveryMode = redisAvailable ? DELIVERY_MODE.BULLMQ : DELIVERY_MODE.DIRECT;

            // 3. Create notification log with PENDING status
            const log = await this.repository.createLog({
                tenantUid: payload.tenantUid,
                module: payload.module,
                referenceUid: payload.referenceUid,
                channel: payload.channel,
                template: payload.template,
                recipient: payload.recipient,
                status: NOTIFICATION_STATUS.PENDING,
                deliveryMode
            }, payload.createdBy);

            logUid = log.uid;

            // 4. Dispatch via the appropriate strategy
            if (redisAvailable) {
                logger.info(`Dispatching notification via BullMQ [Log UID: ${logUid}]`);
                await this.bullmqDispatcher.dispatch(payload, logUid);
            } else {
                logger.info(`Dispatching notification via Direct fallback [Log UID: ${logUid}]`);
                await this.directDispatcher.dispatch(payload, logUid);
            }

            return { success: true, logUid };
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error(`${NOTIFICATION_MESSAGES.DISPATCH_FAILED} [Module: ${payload.module}, Ref: ${payload.referenceUid}]: ${errorMessage}`);

            // Attempt to update the log if it was created
            if (logUid) {
                try {
                    await this.repository.updateStatus(
                        logUid,
                        NOTIFICATION_STATUS.FAILED,
                        errorMessage
                    );
                } catch (dbError) {
                    logger.error(`Failed to update notification log after send failure [Log UID: ${logUid}]`, dbError);
                }
            }

            // NEVER throw — always return success to the business module
            return { success: false, logUid };
        }
    }
}

/** Singleton notification service instance */
export const notificationService = new NotificationService();

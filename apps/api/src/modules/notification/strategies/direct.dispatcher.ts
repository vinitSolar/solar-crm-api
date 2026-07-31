/**
 * Notification Module — Direct Dispatcher (Strategy)
 *
 * Sends notifications directly without going through BullMQ.
 * Used as a fallback when Redis/BullMQ is unavailable.
 *
 * This dispatcher NEVER throws exceptions back to the caller.
 * All errors are caught, logged, and the notification log is updated accordingly.
 */

import { logger } from "@packages/logger/logger.js";
import { emailProvider } from "../providers/email.provider.js";
import { NotificationRepository } from "../repositories/notification.repository.js";
import {
    NOTIFICATION_CHANNEL,
    NOTIFICATION_STATUS,
    NOTIFICATION_MESSAGES
} from "../constants/notification.constants.js";
import { getTemplateConfig, loadTemplateHtml, compileTemplate } from "../helpers/template.helper.js";
import type { ISendNotificationPayload, INotificationDispatcher } from "../interfaces/notification.interfaces.js";

export class DirectDispatcher implements INotificationDispatcher {
    private readonly repository: NotificationRepository;

    constructor() {
        this.repository = new NotificationRepository();
    }

    /**
     * Sends a notification directly (synchronously) and updates the notification log.
     * Never throws — catches all errors and logs them.
     *
     * @param payload The notification payload
     * @param logUid  The notification log UID to update
     */
    async dispatch(payload: ISendNotificationPayload, logUid: string): Promise<void> {
        try {
            // Update status to PROCESSING
            await this.repository.updateStatus(logUid, NOTIFICATION_STATUS.PROCESSING);

            // Route to the appropriate channel handler
            switch (payload.channel) {
                case NOTIFICATION_CHANNEL.EMAIL:
                    await this.sendEmail(payload);
                    break;
                default:
                    logger.warn(`Direct dispatch for channel ${payload.channel} is not yet implemented. [Log UID: ${logUid}]`);
                    await this.repository.updateStatus(
                        logUid,
                        NOTIFICATION_STATUS.FAILED,
                        `Channel ${payload.channel} not implemented for direct dispatch`
                    );
                    return;
            }

            // Mark as FALLBACK_USED (sent via direct strategy)
            await this.repository.updateStatus(
                logUid,
                NOTIFICATION_STATUS.FALLBACK_USED,
                null,
                new Date()
            );

            logger.info(`${NOTIFICATION_MESSAGES.DISPATCH_DIRECT} [Log UID: ${logUid}]`);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error(`${NOTIFICATION_MESSAGES.DISPATCH_FAILED} [Log UID: ${logUid}]: ${errorMessage}`);

            try {
                await this.repository.updateStatus(
                    logUid,
                    NOTIFICATION_STATUS.FAILED,
                    errorMessage
                );
            } catch (dbError) {
                logger.error(`Failed to update notification log after dispatch failure [Log UID: ${logUid}]`, dbError);
            }
        }
    }

    /**
     * Handles email channel sending: loads template, compiles, sends via provider.
     */
    private async sendEmail(payload: ISendNotificationPayload): Promise<void> {
        const templateConfig = getTemplateConfig(payload.template);

        // Add utility variables
        const variables: Record<string, string> = {
            ...payload.variables,
            current_year: new Date().getFullYear().toString()
        };

        // Compile subject and HTML body
        const subject = compileTemplate(templateConfig.subject, variables);
        const rawHtml = loadTemplateHtml(templateConfig.htmlPath);
        const html = compileTemplate(rawHtml, variables);

        // Send via email provider
        await emailProvider.sendEmail(payload.recipient, subject, html);
    }
}

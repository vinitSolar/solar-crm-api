/**
 * Notification Module — Public Exports
 */

export { notificationService } from "./services/notification.service.js";
export { startNotificationWorker } from "./workers/notification.worker.js";

export {
    NOTIFICATION_CHANNEL,
    NOTIFICATION_STATUS,
    DELIVERY_MODE,
    NOTIFICATION_TEMPLATE,
    NOTIFICATION_MESSAGES
} from "./constants/notification.constants.js";

export type {
    ISendNotificationPayload,
    ISendNotificationResult,
    INotificationLog
} from "./interfaces/notification.interfaces.js";

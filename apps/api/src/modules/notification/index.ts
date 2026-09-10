/**
 * Notification Module — Public Exports
 */

export { notificationService } from "./services/notification.service.js";
export { startNotificationWorker } from "./workers/notification.worker.js";

export { notificationRoutes } from "./routes/notification.routes.js";
export { inAppNotificationService } from "./services/in-app-notification.service.js";
export { InAppNotificationRepository } from "./repositories/in-app-notification.repository.js";

export {
    NOTIFICATION_CHANNEL,
    NOTIFICATION_STATUS,
    DELIVERY_MODE,
    NOTIFICATION_TEMPLATE,
    NOTIFICATION_MESSAGES
} from "./constants/notification.constants.js";

export {
    IN_APP_NOTIFICATION_MESSAGES,
    IN_APP_READ_STATUS,
    IN_APP_STATUS_FILTER
} from "./constants/in-app-notification.constants.js";

export type {
    ISendNotificationPayload,
    ISendNotificationResult,
    INotificationLog
} from "./interfaces/notification.interfaces.js";

export type {
    INotification,
    INotificationSafe,
    ICreateInAppNotification,
    IGetNotificationsFilter,
    IPaginatedNotifications
} from "./interfaces/in-app-notification.interface.js";


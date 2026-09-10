/**
 * Notification Module — In-App Notification DTO
 */

import type { INotification, INotificationSafe } from "../interfaces/in-app-notification.interface.js";

/**
 * Transforms an internal database notification entity to a safe consumer DTO.
 */
export function toNotificationSafe(notification: INotification): INotificationSafe {
    return {
        uid: notification.uid,
        title: notification.title,
        body: notification.body,
        module: notification.module,
        referenceUid: notification.referenceUid,
        template: notification.template,
        data: notification.data ?? {},
        isRead: Number(notification.isRead) === 1,
        readAt: notification.readAt,
        createdAt: notification.createdAt,
        isDeleted: Number(notification.isDeleted) === 1
    };
}

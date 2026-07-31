/**
 * Notification Module — Interfaces
 *
 * TypeScript interfaces for the notification system.
 */

import type {
    NOTIFICATION_CHANNEL,
    NOTIFICATION_STATUS,
    NOTIFICATION_TEMPLATE,
    DELIVERY_MODE
} from "../constants/notification.constants.js";

/** Payload passed by business modules to notificationService.send() */
export interface ISendNotificationPayload {
    channel: NOTIFICATION_CHANNEL;
    template: NOTIFICATION_TEMPLATE;
    recipient: string;
    module: string;
    referenceUid: string;
    tenantUid: string;
    variables: Record<string, string>;
    createdBy?: string;
}

/** Data required to create a notification log entry */
export interface ICreateNotificationLog {
    tenantUid: string;
    module: string;
    referenceUid: string;
    channel: NOTIFICATION_CHANNEL;
    template: string;
    recipient: string;
    status: NOTIFICATION_STATUS;
    deliveryMode: DELIVERY_MODE;
    errorMessage?: string | null;
    retryCount?: number;
    sentAt?: Date | null;
}

/** Notification log row returned from database */
export interface INotificationLog {
    id: string;
    uid: string;
    tenantUid: string;
    module: string;
    referenceUid: string;
    channel: number;
    template: string;
    recipient: string;
    status: number;
    deliveryMode: number;
    errorMessage: string | null;
    retryCount: number;
    sentAt: Date | null;
    isActive: number;
    isDeleted: number;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string | null;
    updatedBy: string | null;
    deletedBy: string | null;
}

/** Strategy interface for notification dispatchers */
export interface INotificationDispatcher {
    dispatch(payload: ISendNotificationPayload, logUid: string): Promise<void>;
}

/** Resolved template configuration */
export interface ITemplateConfig {
    subject: string;
    htmlPath: string;
    requiredKeys: string[];
}

/** Result returned by notificationService.send() */
export interface ISendNotificationResult {
    success: boolean;
    logUid: string;
}

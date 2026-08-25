/**
 * Notification Module — Constants
 *
 * Enums, status codes, and message strings for the notification system.
 */

/** Supported notification channels */
export enum NOTIFICATION_CHANNEL {
    EMAIL = 0,
    SMS = 1,
    WHATSAPP = 2,
    PUSH = 3,
    IN_APP = 4
}

/** Notification log statuses */
export enum NOTIFICATION_STATUS {
    PENDING = 0,
    QUEUED = 1,
    PROCESSING = 2,
    SENT = 3,
    FAILED = 4,
    FALLBACK_USED = 5
}

/** Delivery mechanism used */
export enum DELIVERY_MODE {
    DIRECT = 0,
    BULLMQ = 1
}

/** Registered notification templates */
export enum NOTIFICATION_TEMPLATE {
    QUOTATION_GENERATED = "QUOTATION_GENERATED",
    PROJECT_CREATED = "PROJECT_CREATED",
    PAYMENT_RECEIVED = "PAYMENT_RECEIVED",
    PAYMENT_REMINDER = "PAYMENT_REMINDER",
    INSTALLATION_SCHEDULED = "INSTALLATION_SCHEDULED",
    SUBSIDY_APPROVED = "SUBSIDY_APPROVED",
    PASSWORD_RESET = "PASSWORD_RESET",
    FRANCHISE_CREDENTIALS = "FRANCHISE_CREDENTIALS"
}

/** BullMQ queue configuration */
export const NOTIFICATION_QUEUE = {
    NAME: "notification",
    DEFAULT_ATTEMPTS: 3,
    BACKOFF_TYPE: "exponential" as const,
    BACKOFF_DELAY: 5000
} as const;

/** Redis health cache TTL in milliseconds */
export const REDIS_HEALTH_CACHE_TTL_MS = 5000;

/** Hardcoded messages */
export const NOTIFICATION_MESSAGES = {
    LOG_CREATED: "Notification log created successfully.",
    LOG_UPDATED: "Notification log updated successfully.",
    DISPATCH_BULLMQ: "Notification dispatched via BullMQ.",
    DISPATCH_DIRECT: "Notification dispatched via Direct strategy.",
    DISPATCH_FAILED: "Notification dispatch failed.",
    TEMPLATE_NOT_FOUND: "Notification template not found.",
    TEMPLATE_LOAD_FAILED: "Failed to load notification template.",
    RECIPIENT_EMPTY: "Notification recipient is empty or invalid.",
    SEND_SUCCESS: "Notification sent successfully.",
    SEND_FAILED: "Failed to send notification.",
    WORKER_STARTED: "Notification BullMQ worker started.",
    WORKER_FAILED: "Notification worker failed to start.",
    WORKER_JOB_COMPLETED: "Notification worker job completed.",
    WORKER_JOB_FAILED: "Notification worker job failed.",
    REDIS_AVAILABLE: "Redis is available for BullMQ.",
    REDIS_UNAVAILABLE: "Redis is unavailable. Using direct fallback.",
    EMAIL_SEND_SUCCESS: "Email sent successfully via provider.",
    EMAIL_SEND_FAILED: "Email sending failed via provider."
} as const;

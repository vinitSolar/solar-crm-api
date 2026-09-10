/**
 * Notification Module — In-App Notification Constants
 */

export const IN_APP_NOTIFICATION_MESSAGES = {
    FETCHED_SUCCESSFULLY: "Notifications fetched successfully.",
    UNREAD_COUNT_FETCHED: "Unread notifications count fetched successfully.",
    MARKED_AS_READ: "Notification marked as read successfully.",
    ALL_MARKED_AS_READ: "All notifications marked as read successfully.",
    NOT_FOUND: "Notification not found.",
    DELETED_SUCCESSFULLY: "Notification deleted successfully.",
    RESTORED_SUCCESSFULLY: "Notification restored successfully.",
    CREATED_SUCCESSFULLY: "Notification created successfully.",
    VALIDATION_ERROR: "Validation error in notification request."
} as const;

export const IN_APP_READ_STATUS = {
    ALL: "all",
    UNREAD: "unread",
    READ: "read"
} as const;

export type InAppReadStatus = (typeof IN_APP_READ_STATUS)[keyof typeof IN_APP_READ_STATUS];

export const IN_APP_STATUS_FILTER = {
    ACTIVE: "active",
    DELETED: "deleted",
    ALL: "all"
} as const;

export type InAppStatusFilter = (typeof IN_APP_STATUS_FILTER)[keyof typeof IN_APP_STATUS_FILTER];

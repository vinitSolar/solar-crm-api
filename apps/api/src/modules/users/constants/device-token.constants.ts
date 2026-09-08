/**
 * Centralized messages for device tokens and mobile push notifications.
 */
export const DEVICE_TOKEN_MESSAGES = {
    REGISTERED_SUCCESS: "Device token registered successfully",
    DEACTIVATED_SUCCESS: "Device token deactivated successfully",
    PUSH_SENT_SUCCESS: "Push notification dispatched successfully",
    NO_ACTIVE_TOKENS: "No active mobile device tokens found for this user. Ensure the user has logged in from the mobile app.",
    USER_NOT_FOUND: "Target user not found or does not belong to this tenant",
    FIREBASE_NOT_CONFIGURED: "Firebase push notification service is not configured on the server",
    INVALID_USER_UID: "Invalid user UID format",
    DEVICE_TOKEN_REQUIRED: "deviceToken is required and must be at least 10 characters long",
    DEVICE_TYPE_REQUIRED: "deviceType must be either 'android' or 'ios'"
} as const;

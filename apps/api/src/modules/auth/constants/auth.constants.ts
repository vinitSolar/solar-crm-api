/**
 * Centralized authentication messages.
 * All user-facing strings should be referenced from here.
 */
export const AUTH_MESSAGES = {
    LOGIN_SUCCESS: "Login successful",
    LOGIN_FAILED: "Invalid email or password",
    REFRESH_SUCCESS: "Token refreshed successfully",
    REFRESH_FAILED: "Invalid or expired refresh token",
    UNAUTHORIZED: "Unauthorized access",
    FORBIDDEN: "You do not have permission to access this resource",
    USER_NOT_FOUND: "User not found",
    USER_INACTIVE: "User account is inactive. Please contact support.",
    USER_LOCKED: "User account is locked due to too many failed attempts.",
    TOKEN_EXPIRED: "Token has expired",
    TOKEN_INVALID: "Invalid token",
    TOKEN_MISSING: "Authorization token is missing",
    PROFILE_FETCHED: "User profile fetched successfully",
    VALIDATION_ERROR: "Validation failed",
    TENANT_REQUIRED: "Tenant identifier is required",
    LOGOUT_SUCCESS: "Logout successful",
    SESSION_INVALID: "Session is invalid or expired",
} as const;

/**
 * User account status values.
 * Maps to the `is_active` SMALLINT column in the `users` table.
 */
export const USER_STATUS = {
    INACTIVE: 0,
    ACTIVE: 1,
    LOCKED: 2,
} as const;

/**
 * Token type identifiers.
 */
export const TOKEN_TYPES = {
    ACCESS: "access",
    REFRESH: "refresh",
} as const;

/**
 * Bcrypt configuration.
 */
export const BCRYPT_SALT_ROUNDS = 12;

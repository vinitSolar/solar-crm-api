/**
 * Centralized franchise messages.
 * All user-facing strings should be referenced from here.
 */
export const FRANCHISE_MESSAGES = {
    // Success messages
    CREATED_SUCCESS: "Franchise created successfully",
    FETCHED_SUCCESS: "Franchises fetched successfully",
    FETCHED_ALL_SUCCESS: "All franchises fetched successfully",
    FETCHED_ONE_SUCCESS: "Franchise fetched successfully",
    UPDATED_SUCCESS: "Franchise updated successfully",
    DELETED_SUCCESS: "Franchise deleted successfully",
    RESTORED_SUCCESS: "Franchise restored successfully",

    // Error messages
    CREATION_FAILED: "Failed to create franchise",
    NOT_FOUND: "Franchise not found",
    CODE_ALREADY_EXISTS: "A tenant with this code already exists",
    UPDATE_FAILED: "Failed to update franchise",
    DELETE_FAILED: "Failed to delete franchise",
    RESTORE_FAILED: "Failed to restore franchise or franchise not found in deleted state",
    UPDATE_NO_FIELDS: "At least one field must be provided to update",

    // Validation messages
    VALIDATION_ERROR: "Validation Error",
    INVALID_UID: "Invalid franchise UID",
    INVALID_NAME: "Franchise name must be between 2 and 255 characters",
    INVALID_CODE: "Franchise code must be between 2 and 100 characters",
    INVALID_EMAIL: "Invalid email format",
    INVALID_MOBILE: "Invalid mobile number",
    OWNER_FULL_NAME_REQUIRED: "Owner full name must be between 2 and 255 characters",
    OWNER_MOBILE_REQUIRED: "Owner mobile number is required",
    BUSINESS_NAME_REQUIRED: "Business name must be between 2 and 255 characters",
    GST_NUMBER_REQUIRED: "GST number is required",
    GST_NUMBER_INVALID: "Invalid GST number format",
    PAN_NUMBER_REQUIRED: "PAN number is required",
    PAN_NUMBER_INVALID: "Invalid PAN number format",
} as const;

/**
 * Tenant type identifiers.
 * Maps to the `type` SMALLINT column in the `tenants` table.
 */
export const TENANT_TYPE = {
    HEAD_OFFICE: 0,
    FRANCHISE: 1,
} as const;

/**
 * Onboarding status values.
 * Maps to the `onboarding_status` SMALLINT column in the `tenants` table.
 */
export const ONBOARDING_STATUS = {
    PENDING: 0,
    IN_PROGRESS: 1,
    COMPLETED: 2,
} as const;

/**
 * Franchise (tenant) active status values.
 * Maps to the `is_active` SMALLINT column in the `tenants` table.
 */
export const FRANCHISE_STATUS = {
    INACTIVE: 0,
    ACTIVE: 1,
    SUSPENDED: 2,
} as const;

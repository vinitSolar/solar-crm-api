/**
 * Centralized state subsidy rule messages.
 * All user-facing strings should be referenced from here.
 */
export const STATE_SUBSIDY_RULE_MESSAGES = {
    // Success messages
    CREATED: "State subsidy rule created successfully",
    FETCHED: "State subsidy rules fetched successfully",
    UPDATED: "State subsidy rule updated successfully",
    DELETED: "State subsidy rule deleted successfully",
    RESTORED: "State subsidy rule restored successfully",

    // Error messages
    CREATION_FAILED: "Failed to create state subsidy rule",
    NOT_FOUND: "State subsidy rule not found",
    UPDATE_FAILED: "Failed to update state subsidy rule",
    DELETE_FAILED: "Failed to delete state subsidy rule",
    RESTORE_FAILED: "Failed to restore state subsidy rule or rule not found in deleted state",
    STATE_ALREADY_EXISTS: "A subsidy rule with this state name already exists",
    HEAD_OFFICE_ONLY: "Only Head Office is permitted to manage state subsidy rules",

    // Validation messages
    VALIDATION_ERROR: "Validation Error",
    INVALID_UID: "Invalid UID",
    STATE_REQUIRED: "State name is required",
    SUBSIDY_PER_KW_INVALID: "Subsidy per kW must be greater than or equal to zero",
    MAXIMUM_SUBSIDY_AMOUNT_INVALID: "Maximum subsidy amount must be greater than or equal to zero",
} as const;

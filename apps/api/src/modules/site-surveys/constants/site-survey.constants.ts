export const SITE_SURVEY_MESSAGES = {
    CREATED: "Site survey scheduled successfully.",
    FETCHED_SUCCESSFULLY: "Site survey fetched successfully.",
    UPDATED: "Site survey updated successfully.",
    DELETED: "Site survey deleted successfully.",
    RESTORED: "Site survey restored successfully.",
    NOT_FOUND: "Site survey not found.",
    LEAD_NOT_FOUND: "Lead not found or does not belong to this tenant.",
    USER_NOT_FOUND: "Assigned user not found or does not belong to this tenant.",
    CREATION_FAILED: "Failed to schedule site survey.",
    UPDATE_FAILED: "Failed to update site survey.",
    DELETE_FAILED: "Failed to delete site survey.",
    RESTORE_FAILED: "Failed to restore site survey.",
    INVALID_STATUS: "Invalid site survey status.",
    INACTIVE_LEAD: "Cannot schedule survey for an inactive or deleted lead.",
    VALIDATION_FAILED: "Validation failed",
};

export const SITE_SURVEY_VALIDATION_MESSAGES = {
    LEAD_UID_REQUIRED: "Lead UID is required",
    LEAD_UID_INVALID: "Invalid lead UID format",
    USER_UID_REQUIRED: "Assigned To user UID is required",
    USER_UID_INVALID: "Invalid user UID format",
    SCHEDULED_AT_REQUIRED: "Scheduled At is required",
    SCHEDULED_AT_INVALID: "Invalid date format for scheduledAt",
    UID_INVALID: "Invalid UID format",
};

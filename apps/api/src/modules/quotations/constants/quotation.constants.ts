export const QUOTATION_VALIDATION_MESSAGES = {
    LEAD_UID_REQUIRED: "Lead UID is required",
    INVALID_LEAD_UID: "Invalid Lead UID format",
    INVALID_UID: "Invalid UID format",
    SYSTEM_SIZE_REQUIRED: "System size is required",
    SYSTEM_SIZE_POSITIVE: "System size must be a positive number",
    VALID_TILL_REQUIRED: "Valid till date is required",
    INVALID_VALID_TILL: "Invalid valid till date format",
    STATUS_INVALID: "Invalid status value",
    NOTES_MAX: "Notes cannot exceed 1000 characters",
    PRODUCTS_REQUIRED: "At least one product is required",
    PRODUCT_UID_REQUIRED: "Product UID is required",
    INVALID_PRODUCT_UID: "Invalid Product UID format",
    QUANTITY_REQUIRED: "Quantity is required",
    QUANTITY_POSITIVE: "Quantity must be a positive number",
    PRICE_POSITIVE: "Price per unit must be a positive number",
    GST_PERCENTAGE_INVALID: "GST percentage must be between 0 and 100",
    RECORD_NOT_FOUND: "Quotation not found",
    CANNOT_EDIT_CONVERTED: "Cannot edit a quotation that has already been converted to a project",
    LEAD_NOT_FOUND: "Lead not found",
    PRODUCT_NOT_FOUND: "Product not found",
};

export const QUOTATION_MESSAGES = {
    CREATED_SUCCESSFULLY: "Quotation created successfully",
    UPDATED_SUCCESSFULLY: "Quotation updated successfully",
    RETRIEVED_SUCCESSFULLY: "Quotation retrieved successfully",
    FETCHED_SUCCESSFULLY: "Quotation list fetched successfully",
    DELETED_SUCCESSFULLY: "Quotation deleted successfully",
    RESTORED_SUCCESSFULLY: "Quotation restored successfully",
    CONVERTED_SUCCESSFULLY: "Quotation converted to project successfully",
};

export const QUOTATION_QUEUE = {
    NAME: "quotation_snapshot_queue",
    DEFAULT_ATTEMPTS: 3,
    BACKOFF_TYPE: "exponential",
    BACKOFF_DELAY: 5000,
};

export const QUOTATION_WORKER_MESSAGES = {
    WORKER_STARTED: "Quotation snapshot worker started successfully.",
    WORKER_FAILED: "Failed to start quotation snapshot worker",
    WORKER_JOB_FAILED: "Quotation snapshot job failed",
    WORKER_JOB_COMPLETED: "Quotation snapshot job completed successfully",
};

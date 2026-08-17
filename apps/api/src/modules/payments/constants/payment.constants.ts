export const PAYMENT_METHODS = {
    CASH: 0,
    BANK_TRANSFER: 1,
    UPI: 2,
    CHEQUE: 3,
    CARD: 4,
    ONLINE: 5,
    OTHER: 6,
};



export const PAYMENT_MESSAGES = {
    NOT_FOUND: "Payment not found",
    CREATED: "Payment created successfully",
    UPDATED: "Payment updated successfully",
    DELETED: "Payment deleted successfully",
    RESTORED: "Payment restored successfully",
    CREATION_FAILED: "Failed to create payment",
    UPDATE_FAILED: "Failed to update payment",
    DELETE_FAILED: "Failed to delete payment",
    RESTORE_FAILED: "Failed to restore payment",
    FETCHED_SUCCESSFULLY: "Payments fetched successfully",
    SUMMARY_FETCHED: "Payment summary fetched successfully",
    LEAD_NOT_FOUND: "Lead not found or does not belong to this tenant",
    VALIDATION_FAILED: "Validation failed",
};

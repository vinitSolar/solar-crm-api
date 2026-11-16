/**
 * Status Progression Events & Semantic Status Constants
 */

export const STATUS_EVENTS = {
    // Lead Lifecycle Triggers
    FOLLOWUP_SCHEDULED: "lead.followup.scheduled",
    SURVEY_COMPLETED: "survey.completed",
    QUOTATION_SENT: "quotation.sent",
    QUOTATION_APPROVED: "quotation.approved",

    // Project Lifecycle Triggers
    PAYMENT_RECEIVED: "payment.received",
    MILESTONE_UPDATED: "milestone.updated",
    ALL_MILESTONES_COMPLETED: "milestones.all_completed",
} as const;

export type StatusEventType = typeof STATUS_EVENTS[keyof typeof STATUS_EVENTS];

/**
 * Semantic status keys used to dynamically resolve tenant-specific status UIDs
 */
export const SEMANTIC_STATUS = {
    LEAD: {
        DRAFT: "DRAFT",
        NEW: "NEW",
        CONTACTED: "CONTACTED",
        FOLLOW_UP: "FOLLOW_UP",
        SURVEY_COMPLETED: "SURVEY_COMPLETED",
        QUOTATION_SENT: "QUOTATION_SENT",
        NEGOTIATION: "NEGOTIATION",
        WON: "WON",
        LOST: "LOST",
    },
    PROJECT: {
        NOT_STARTED: "NOT_STARTED",
        IN_PROGRESS: "IN_PROGRESS",
        COMMISSIONED: "COMMISSIONED",
        ON_HOLD: "ON_HOLD",
        CANCELLED: "CANCELLED",
    }
} as const;


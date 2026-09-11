/**
 * WhatsApp Self-Service Module — Constants & Templates
 *
 * Centralized constants, conversation states, and customer-safe messaging templates.
 */

export const WHATSAPP_CONVERSATION_STATE = {
    MAIN_MENU: "MAIN_MENU",
    LEAD_SELECTION: "LEAD_SELECTION",
    APPLICATION_STATUS: "APPLICATION_STATUS",
    SOLAR_JOURNEY: "SOLAR_JOURNEY",
    ASSIGNED_EXECUTIVE: "ASSIGNED_EXECUTIVE"
} as const;

export type WhatsAppConversationState = typeof WHATSAPP_CONVERSATION_STATE[keyof typeof WHATSAPP_CONVERSATION_STATE];

export const WHATSAPP_MENU_OPTIONS = {
    MAIN_MENU: "0",
    APPLICATION_STATUS: "1",
    SOLAR_JOURNEY: "2",
    ASSIGNED_EXECUTIVE: "3"
} as const;

export const WHATSAPP_NAV_RESET_COMMANDS = new Set([
    "0",
    "menu",
    "main menu",
    "mainmenu",
    "home",
    "start",
    "reset"
]);

export const WHATSAPP_SESSION_EXPIRY_HOURS = 24;

export const WHATSAPP_SELF_SERVICE_MESSAGES = {
    CUSTOMER_NOT_FOUND: 
`Hello 👋

We could not find an existing solar application associated with this WhatsApp number.

Please contact Sunselect support for assistance.`,

    INVALID_OPTION:
`I didn't understand that option.

Please select one of the following:

1. 📊 My Application Status
2. 📋 My Solar Journey
3. 👤 My Assigned Executive

0. 🏠 Main Menu`,

    NO_EXECUTIVE_ASSIGNED:
`👤 Your Assigned Solar Executive

No executive has been assigned to your solar application yet. Our team will assign a dedicated solar specialist to assist you shortly.

0. 🏠 Main Menu`,

    SESSION_EXPIRED:
`Your session has expired. Returning to Main Menu.`,

    UNAUTHORIZED_ACCESS:
`We could not find an existing solar application associated with this WhatsApp number. Please contact support.`
};

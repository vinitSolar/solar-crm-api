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

export const WHATSAPP_INTERACTIVE_ACTIONS = {
    APPLICATION_STATUS: "application_status",
    SOLAR_JOURNEY: "solar_journey",
    ASSIGNED_EXECUTIVE: "assigned_executive",
    MAIN_MENU: "main_menu"
} as const;

export type WhatsAppInteractiveAction = typeof WHATSAPP_INTERACTIVE_ACTIONS[keyof typeof WHATSAPP_INTERACTIVE_ACTIONS];

export const WHATSAPP_GREETINGS = new Set([
    "hello",
    "hi",
    "hey",
    "good morning",
    "good afternoon",
    "good evening",
    "start",
    "menu",
    "help",
    "namaste",
    "hi there",
    "hello there"
]);

export const WHATSAPP_NAV_RESET_COMMANDS = new Set([
    "0",
    "menu",
    "main menu",
    "mainmenu",
    "home",
    "start",
    "reset",
    "main_menu"
]);

export const WHATSAPP_SESSION_EXPIRY_HOURS = 24;

export const WHATSAPP_SELF_SERVICE_MESSAGES = {
    CUSTOMER_NOT_FOUND: 
`Hello 👋

We could not find an existing solar application associated with this WhatsApp number.

Please contact Sunselect support for assistance.`,

    NO_EXECUTIVE_ASSIGNED:
`👤 Your Assigned Solar Executive

No executive has been assigned to your solar application yet. Our team will assign a dedicated solar specialist to assist you shortly.`,

    SESSION_EXPIRED:
`Your session has expired. Returning to Main Menu.`,

    UNAUTHORIZED_ACCESS:
`We could not find an existing solar application associated with this WhatsApp number. Please contact support.`,

    MAIN_MENU_HEADER: "🏠 Sunselect CRM",
    MAIN_MENU_BODY: "Welcome! 👋\n\nPlease select an option to view your solar application details.",
    GUIDANCE_BODY: "Hello! 👋\n\nPlease select an option from the menu below to continue.",
    VIEW_OPTIONS_BUTTON: "View Options",
    SERVICES_SECTION_TITLE: "My Solar Services",
    MAIN_MENU_BUTTON_TITLE: "🏠 Main Menu",

    OPTION_TITLE_STATUS: "📊 My Application Status",
    OPTION_DESC_STATUS: "View your current application status",

    OPTION_TITLE_JOURNEY: "📋 My Solar Journey",
    OPTION_DESC_JOURNEY: "Track your installation and timeline",

    OPTION_TITLE_EXECUTIVE: "👤 My Assigned Executive",
    OPTION_DESC_EXECUTIVE: "Contact your solar specialist"
};

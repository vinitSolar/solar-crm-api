/**
 * WhatsApp Module — Constants
 *
 * Enums, status codes, and message strings for the WhatsApp Cloud API integration.
 */

export const WHATSAPP_DIRECTION = {
    INBOUND: "inbound",
    OUTBOUND: "outbound"
} as const;

export type WhatsAppDirection = (typeof WHATSAPP_DIRECTION)[keyof typeof WHATSAPP_DIRECTION];

export const WHATSAPP_MESSAGE_STATUS = {
    SENT: "sent",
    DELIVERED: "delivered",
    READ: "read",
    FAILED: "failed",
    RECEIVED: "received"
} as const;

export type WhatsAppMessageStatus = (typeof WHATSAPP_MESSAGE_STATUS)[keyof typeof WHATSAPP_MESSAGE_STATUS];

export const WHATSAPP_MESSAGE_TYPE = {
    TEXT: "text",
    IMAGE: "image",
    DOCUMENT: "document",
    TEMPLATE: "template",
    INTERACTIVE: "interactive",
    REACTION: "reaction",
    LOCATION: "location",
    CONTACTS: "contacts",
    STICKER: "sticker",
    AUDIO: "audio",
    VIDEO: "video"
} as const;

export type WhatsAppMessageType = (typeof WHATSAPP_MESSAGE_TYPE)[keyof typeof WHATSAPP_MESSAGE_TYPE];

export const WHATSAPP_MESSAGES = {
    NOT_CONFIGURED: "WhatsApp Cloud API is not configured. Message skipped.",
    SEND_SUCCESS: "WhatsApp message sent successfully.",
    SEND_FAILED: "Failed to send WhatsApp message.",
    WEBHOOK_VERIFIED: "WhatsApp webhook verification successful.",
    WEBHOOK_VERIFICATION_FAILED: "WhatsApp webhook verification failed.",
    WEBHOOK_RECEIVED: "WhatsApp webhook event received.",
    WEBHOOK_SIGNATURE_INVALID: "Invalid WhatsApp webhook signature.",
    MESSAGE_NOT_FOUND: "WhatsApp message not found.",
    MESSAGE_CREATED: "WhatsApp message logged successfully.",
    MESSAGE_STATUS_UPDATED: "WhatsApp message status updated.",
    MESSAGES_FETCHED: "WhatsApp messages fetched successfully.",
    VALIDATION_ERROR: "Validation error in WhatsApp request.",
    AUTO_REPLY_TEXT: "Hello 👋\nWelcome to Sunselect CRM."
} as const;

export const META_GRAPH_API_BASE = "https://graph.facebook.com";

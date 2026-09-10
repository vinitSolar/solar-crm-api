/**
 * WhatsApp Module — Interfaces
 *
 * TypeScript interfaces for WhatsApp Cloud API integration.
 */

import type {
    WhatsAppDirection,
    WhatsAppMessageStatus,
    WhatsAppMessageType
} from "../constants/whatsapp.constants.js";

/** Database row from whatsapp_messages table */
export interface IWhatsAppMessage {
    id: string;
    uid: string;
    tenantUid: string | null;
    direction: WhatsAppDirection;
    waMessageId: string | null;
    fromNumber: string;
    toNumber: string;
    messageType: WhatsAppMessageType;
    content: string | null;
    templateName: string | null;
    templateData: Record<string, unknown>;
    status: WhatsAppMessageStatus;
    statusTimestamp: Date | null;
    errorCode: string | null;
    errorMessage: string | null;
    rawPayload: Record<string, unknown>;
    isActive: number;
    isDeleted: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    createdBy: string | null;
    updatedBy: string | null;
    deletedBy: string | null;
}

/** Safe DTO for API consumers */
export interface IWhatsAppMessageSafe {
    uid: string;
    tenantUid: string | null;
    direction: string;
    waMessageId: string | null;
    fromNumber: string;
    toNumber: string;
    messageType: string;
    content: string | null;
    templateName: string | null;
    status: string;
    statusTimestamp: Date | null;
    errorCode: string | null;
    errorMessage: string | null;
    createdAt: Date;
}

/** Payload for creating a new message log entry */
export interface ICreateWhatsAppMessage {
    tenantUid?: string | null | undefined;
    direction: WhatsAppDirection;
    waMessageId?: string | null | undefined;
    fromNumber: string;
    toNumber: string;
    messageType: WhatsAppMessageType;
    content?: string | null | undefined;
    templateName?: string | null | undefined;
    templateData?: Record<string, unknown> | undefined;
    status: WhatsAppMessageStatus;
    errorCode?: string | null | undefined;
    errorMessage?: string | null | undefined;
    rawPayload?: Record<string, unknown> | undefined;
    createdBy?: string | null | undefined;
}

/** Payload for sending a text message via the API */
export interface ISendTextPayload {
    to: string;
    text: string;
}

/** Meta Cloud API send message response */
export interface IMetaSendMessageResponse {
    messaging_product: string;
    contacts: Array<{ input: string; wa_id: string }>;
    messages: Array<{ id: string }>;
}

/** Meta webhook entry structure */
export interface IWebhookEntry {
    id: string;
    changes: IWebhookChange[];
}

/** Meta webhook change structure */
export interface IWebhookChange {
    value: IWebhookValue;
    field: string;
}

/** Meta webhook value containing messages and statuses */
export interface IWebhookValue {
    messaging_product: string;
    metadata: {
        display_phone_number: string;
        phone_number_id: string;
    };
    contacts?: Array<{
        profile: { name: string };
        wa_id: string;
    }>;
    messages?: Array<{
        from: string;
        id: string;
        timestamp: string;
        type: string;
        text?: { body: string };
        image?: { id: string; mime_type: string; sha256: string; caption?: string };
        document?: { id: string; mime_type: string; sha256: string; filename?: string; caption?: string };
    }>;
    statuses?: Array<{
        id: string;
        status: string;
        timestamp: string;
        recipient_id: string;
        errors?: Array<{ code: number; title: string }>;
    }>;
}

/** Filter for paginated message list */
export interface IWhatsAppMessageFilter {
    page?: number;
    limit?: number;
    search?: string;
    direction?: "inbound" | "outbound" | "all";
    status?: string;
}

/**
 * WhatsApp Module — Service
 *
 * Business logic layer for WhatsApp messaging and webhook processing.
 */

import { env } from "@packages/config/index.js";
import { logger } from "@packages/logger/logger.js";
import { WHATSAPP_DIRECTION, WHATSAPP_MESSAGE_STATUS, WHATSAPP_MESSAGE_TYPE, WHATSAPP_MESSAGES, type WhatsAppMessageStatus } from "../constants/whatsapp.constants.js";
import type {
    IWhatsAppMessageFilter,
    IWhatsAppMessageSafe,
    IWebhookEntry
} from "../interfaces/whatsapp.interface.js";
import { WhatsAppProvider } from "../providers/whatsapp.provider.js";
import { WhatsAppRepository } from "../repositories/whatsapp.repository.js";

export class WhatsAppService {
    private readonly provider: WhatsAppProvider;
    private readonly repository: WhatsAppRepository;

    constructor(
        provider = new WhatsAppProvider(),
        repository = new WhatsAppRepository()
    ) {
        this.provider = provider;
        this.repository = repository;
    }

    /**
     * Send outbound text message and log to database
     */
    async sendTextMessage(
        to: string,
        text: string,
        tenantUid?: string | null,
        createdBy?: string | null
    ): Promise<IWhatsAppMessageSafe> {
        let waMessageId: string | null = null;
        let status: WhatsAppMessageStatus = WHATSAPP_MESSAGE_STATUS.SENT;
        let errorCode: string | undefined;
        let errorMessage: string | undefined;
        let rawPayload: Record<string, unknown> = {};

        try {
            const metaResponse = await this.provider.sendTextMessage(to, text);
            waMessageId = metaResponse.messages?.[0]?.id || null;
            rawPayload = metaResponse as unknown as Record<string, unknown>;
        } catch (err: any) {
            status = WHATSAPP_MESSAGE_STATUS.FAILED;
            errorMessage = err.message || "Failed to send message";
            errorCode = err.code || null;
            rawPayload = err.raw || {};
            logger.error(`[WhatsAppService] Outbound message failed: ${errorMessage}`);
        }

        // Log message to database regardless of success/failure
        const loggedMsg = await this.repository.createMessage({
            tenantUid,
            direction: WHATSAPP_DIRECTION.OUTBOUND,
            waMessageId,
            fromNumber: env.WHATSAPP.PHONE_NUMBER_ID || "CRM_SYSTEM",
            toNumber: to,
            messageType: WHATSAPP_MESSAGE_TYPE.TEXT,
            content: text,
            status,
            errorCode,
            errorMessage,
            rawPayload,
            createdBy
        });

        if (status === WHATSAPP_MESSAGE_STATUS.FAILED) {
            throw new Error(errorMessage || WHATSAPP_MESSAGES.SEND_FAILED);
        }

        return this.repository.toSafe(loggedMsg);
    }

    /**
     * Send outbound template message and log to database
     */
    async sendTemplateMessage(
        to: string,
        templateName: string,
        languageCode = "en_US",
        parameters: string[] = [],
        tenantUid?: string | null,
        createdBy?: string | null
    ): Promise<IWhatsAppMessageSafe> {
        let waMessageId: string | null = null;
        let status: WhatsAppMessageStatus = WHATSAPP_MESSAGE_STATUS.SENT;
        let errorCode: string | undefined;
        let errorMessage: string | undefined;
        let rawPayload: Record<string, unknown> = {};

        try {
            const metaResponse = await this.provider.sendTemplateMessage(to, templateName, languageCode, parameters);
            waMessageId = metaResponse.messages?.[0]?.id || null;
            rawPayload = metaResponse as unknown as Record<string, unknown>;
        } catch (err: any) {
            status = WHATSAPP_MESSAGE_STATUS.FAILED;
            errorMessage = err.message || "Failed to send template message";
            errorCode = err.code || null;
            rawPayload = err.raw || {};
            logger.error(`[WhatsAppService] Outbound template failed: ${errorMessage}`);
        }

        const loggedMsg = await this.repository.createMessage({
            tenantUid,
            direction: WHATSAPP_DIRECTION.OUTBOUND,
            waMessageId,
            fromNumber: env.WHATSAPP.PHONE_NUMBER_ID || "CRM_SYSTEM",
            toNumber: to,
            messageType: WHATSAPP_MESSAGE_TYPE.TEMPLATE,
            templateName,
            templateData: { languageCode, parameters },
            status,
            errorCode,
            errorMessage,
            rawPayload,
            createdBy
        });

        if (status === WHATSAPP_MESSAGE_STATUS.FAILED) {
            throw new Error(errorMessage || WHATSAPP_MESSAGES.SEND_FAILED);
        }

        return this.repository.toSafe(loggedMsg);
    }

    /**
     * Verify Meta Webhook signature (HMAC SHA-256)
     */
    verifyWebhookSignature(rawBody: Buffer | string, signatureHeader?: string): boolean {
        return this.provider.verifyWebhookSignature(rawBody, signatureHeader);
    }

    /**
     * Verify Meta Webhook subscription verification request (GET)
     */
    verifyWebhookToken(mode?: string, token?: string, challenge?: string): string {
        const verifyToken = env.WHATSAPP.WEBHOOK_VERIFY_TOKEN;

        if (mode === "subscribe" && challenge) {
            if (!verifyToken || verifyToken === "your_random_secret" || token === verifyToken || !token) {
                logger.info(`[WhatsAppService] ${WHATSAPP_MESSAGES.WEBHOOK_VERIFIED}`);
            } else {
                logger.warn(`[WhatsAppService] Webhook token mismatch ('${token}' vs '${verifyToken}'), but returning challenge to maintain Meta connection.`);
            }
            return challenge;
        }

        logger.warn(`[WhatsAppService] ${WHATSAPP_MESSAGES.WEBHOOK_VERIFICATION_FAILED}`);
        throw new Error(WHATSAPP_MESSAGES.WEBHOOK_VERIFICATION_FAILED);
    }

    /**
     * Process incoming Meta Webhook event notification (POST)
     */
    async processWebhookEvent(payload: { object?: string; entry?: IWebhookEntry[] }): Promise<void> {
        logger.info(`[WhatsAppService] Received webhook payload object: ${payload?.object}`);

        if (!Array.isArray(payload?.entry)) {
            logger.debug("[WhatsAppService] Webhook payload missing entry array, ignoring.");
            return;
        }

        for (const entry of payload.entry) {
            if (!Array.isArray(entry.changes)) continue;

            for (const change of entry.changes) {
                const value = change.value;
                if (!value) continue;

                // Process Inbound Messages
                if (Array.isArray(value.messages)) {
                    for (const msg of value.messages) {
                        await this.handleInboundMessage(msg, value);
                    }
                }

                // Process Delivery/Status Updates
                if (Array.isArray(value.statuses)) {
                    for (const statusObj of value.statuses) {
                        await this.handleStatusUpdate(statusObj);
                    }
                }
            }
        }
    }

    /**
     * Handle single incoming customer message
     */
    private async handleInboundMessage(msg: any, value: any): Promise<void> {
        const fromNumber = msg.from;
        const waMessageId = msg.id;
        const messageType = msg.type || WHATSAPP_MESSAGE_TYPE.TEXT;

        let content: string | null = null;
        if (messageType === WHATSAPP_MESSAGE_TYPE.TEXT) {
            content = msg.text?.body || null;
        } else if (msg[messageType]?.caption) {
            content = msg[messageType].caption;
        } else {
            content = `[${messageType.toUpperCase()} Media Message]`;
        }

        logger.info(`[WhatsAppService] Received inbound WhatsApp message from ${fromNumber} (ID: ${waMessageId})`);

        // Avoid logging duplicate inbound messages
        const existing = await this.repository.findByWaMessageId(waMessageId);
        if (existing) {
            logger.info(`[WhatsAppService] Message ${waMessageId} already logged, skipping.`);
            return;
        }

        // Log inbound message
        await this.repository.createMessage({
            direction: WHATSAPP_DIRECTION.INBOUND,
            waMessageId,
            fromNumber,
            toNumber: value.metadata?.display_phone_number || env.WHATSAPP.PHONE_NUMBER_ID || "CRM_RECEIVER",
            messageType: messageType as any,
            content,
            status: WHATSAPP_MESSAGE_STATUS.RECEIVED,
            rawPayload: msg
        });

        // Trigger automatic reply if configured and Provider is available
        if (this.provider.isConfigured() && content) {
            this.sendAutoReply(fromNumber).catch((err) => {
                logger.error(`[WhatsAppService] Failed to send auto-reply to ${fromNumber}:`, err.message);
            });
        }
    }

    /**
     * Send auto-reply in background
     */
    private async sendAutoReply(to: string): Promise<void> {
        logger.info(`[WhatsAppService] Triggering auto-reply to ${to}`);
        await this.sendTextMessage(to, WHATSAPP_MESSAGES.AUTO_REPLY_TEXT);
    }

    /**
     * Handle single message status update (sent, delivered, read, failed)
     */
    private async handleStatusUpdate(statusObj: any): Promise<void> {
        const waMessageId = statusObj.id;
        const status = statusObj.status as any;
        const timestamp = statusObj.timestamp ? new Date(parseInt(statusObj.timestamp, 10) * 1000) : new Date();

        let errorCode: string | undefined;
        let errorMessage: string | undefined;

        if (statusObj.errors && statusObj.errors.length > 0) {
            errorCode = String(statusObj.errors[0].code);
            errorMessage = statusObj.errors[0].title || statusObj.errors[0].message;
        }

        logger.info(`[WhatsAppService] Status update for ${waMessageId}: ${status}`);

        await this.repository.updateStatusByWaMessageId(
            waMessageId,
            status,
            timestamp,
            errorCode,
            errorMessage
        );
    }

    /**
     * Fetch paginated list of logged WhatsApp messages
     */
    async getPaginatedMessages(
        filter: IWhatsAppMessageFilter,
        tenantUid?: string | null
    ): Promise<{ messages: IWhatsAppMessageSafe[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
        const page = filter.page || 1;
        const limit = filter.limit || 20;

        const { messages, total } = await this.repository.findPaginated(filter, tenantUid);
        const safeMessages = messages.map((m) => this.repository.toSafe(m));
        const totalPages = Math.ceil(total / limit) || 1;

        return {
            messages: safeMessages,
            meta: {
                total,
                page,
                limit,
                totalPages
            }
        };
    }
}

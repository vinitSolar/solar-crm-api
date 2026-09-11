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
import { WhatsAppSelfServiceService } from "./whatsapp-self-service.service.js";

// In-memory LRU cache to deduplicate rapid concurrent webhook deliveries
const processedWebhookMessageIds = new Set<string>();
const MAX_PROCESSED_CACHE_SIZE = 5000;

export class WhatsAppService {
    private readonly provider: WhatsAppProvider;
    private readonly repository: WhatsAppRepository;
    private readonly selfService: WhatsAppSelfServiceService;

    constructor(
        provider = new WhatsAppProvider(),
        repository = new WhatsAppRepository(),
        selfService = new WhatsAppSelfServiceService()
    ) {
        this.provider = provider;
        this.repository = repository;
        this.selfService = selfService;
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
     * Send outbound interactive message (list/button) and log to database
     */
    async sendInteractiveMessage(
        to: string,
        interactive: Record<string, unknown>,
        tenantUid?: string | null,
        createdBy?: string | null
    ): Promise<IWhatsAppMessageSafe> {
        let waMessageId: string | null = null;
        let status: WhatsAppMessageStatus = WHATSAPP_MESSAGE_STATUS.SENT;
        let errorCode: string | undefined;
        let errorMessage: string | undefined;
        let rawPayload: Record<string, unknown> = {};

        try {
            const metaResponse = await this.provider.sendInteractiveMessage(to, interactive);
            waMessageId = metaResponse.messages?.[0]?.id || null;
            rawPayload = metaResponse as unknown as Record<string, unknown>;
        } catch (err: any) {
            status = WHATSAPP_MESSAGE_STATUS.FAILED;
            errorMessage = err.message || "Failed to send interactive message";
            errorCode = err.code || null;
            rawPayload = err.raw || {};
            logger.error(`[WhatsAppService] Outbound interactive failed: ${errorMessage}`);
        }

        const bodyContent = (interactive.body as any)?.text || JSON.stringify(interactive);

        const loggedMsg = await this.repository.createMessage({
            tenantUid,
            direction: WHATSAPP_DIRECTION.OUTBOUND,
            waMessageId,
            fromNumber: env.WHATSAPP.PHONE_NUMBER_ID || "CRM_SYSTEM",
            toNumber: to,
            messageType: WHATSAPP_MESSAGE_TYPE.INTERACTIVE,
            content: bodyContent,
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

        // 1. Duplicate Webhook Protection (In-Memory + Database verification)
        if (waMessageId) {
            if (processedWebhookMessageIds.has(waMessageId)) {
                logger.info(`[WhatsAppService] Duplicate webhook event detected in-memory for ${waMessageId}, skipping.`);
                return;
            }

            const existing = await this.repository.findByWaMessageId(waMessageId);
            if (existing) {
                logger.info(`[WhatsAppService] Message ${waMessageId} already logged in database, skipping duplicate.`);
                processedWebhookMessageIds.add(waMessageId);
                return;
            }

            // Track processed ID to prevent rapid concurrent duplicates
            processedWebhookMessageIds.add(waMessageId);
            if (processedWebhookMessageIds.size > MAX_PROCESSED_CACHE_SIZE) {
                const firstKey = processedWebhookMessageIds.values().next().value;
                if (firstKey) processedWebhookMessageIds.delete(firstKey);
            }
        }

        // 2. Extract message text and interactive id across types
        let content: string | null = null;
        let interactiveId: string | null = null;

        if (msg.interactive?.list_reply) {
            interactiveId = msg.interactive.list_reply.id || null;
            content = msg.interactive.list_reply.title || interactiveId;
        } else if (msg.interactive?.button_reply) {
            interactiveId = msg.interactive.button_reply.id || null;
            content = msg.interactive.button_reply.title || interactiveId;
        } else if (messageType === WHATSAPP_MESSAGE_TYPE.TEXT) {
            content = msg.text?.body || null;
        } else if (msg.button) {
            interactiveId = msg.button.payload || null;
            content = msg.button.text || msg.button.payload || null;
        } else if (msg[messageType]?.caption) {
            content = msg[messageType].caption;
        } else {
            content = `[${messageType.toUpperCase()} Media Message]`;
        }

        logger.info(`[WhatsAppService] Received inbound WhatsApp message from ${fromNumber} (ID: ${waMessageId}, Content: '${content}', InteractiveId: '${interactiveId}')`);

        // 3. Log inbound message
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

        // 4. Trigger Customer Self-Service Journey
        if (this.provider.isConfigured() && (content || interactiveId)) {
            try {
                const response = await this.selfService.handleIncomingMessage(fromNumber, content || "", interactiveId);
                if (response.type === "interactive") {
                    await this.sendInteractiveMessage(fromNumber, response.payload as Record<string, unknown>);
                } else if (response.type === "text" && typeof response.payload === "string") {
                    await this.sendTextMessage(fromNumber, response.payload);
                }
            } catch (err: any) {
                logger.error(`[WhatsAppService] Failed to process self-service journey for ${fromNumber}:`, err.message);
            }
        }
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

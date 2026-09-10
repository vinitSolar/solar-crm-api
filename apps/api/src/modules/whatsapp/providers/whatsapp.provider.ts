/**
 * WhatsApp Module — Provider
 *
 * Direct interface to Meta WhatsApp Cloud API via HTTP (axios).
 * Handles raw Graph API requests for text messages, template messages, and webhook signature verification.
 */

import axios from "axios";
import crypto from "node:crypto";
import { env } from "@packages/config/index.js";
import { logger } from "@packages/logger/logger.js";
import { META_GRAPH_API_BASE, WHATSAPP_MESSAGES } from "../constants/whatsapp.constants.js";
import type { IMetaSendMessageResponse } from "../interfaces/whatsapp.interface.js";

export class WhatsAppProvider {
    /**
     * Checks if WhatsApp Cloud API environment variables are configured
     */
    isConfigured(): boolean {
        return Boolean(env.WHATSAPP.PHONE_NUMBER_ID && env.WHATSAPP.ACCESS_TOKEN);
    }

    /**
     * Get base URL for Graph API requests
     */
    private getBaseUrl(): string {
        const version = env.WHATSAPP.API_VERSION || "v21.0";
        const phoneNumberId = env.WHATSAPP.PHONE_NUMBER_ID;
        return `${META_GRAPH_API_BASE}/${version}/${phoneNumberId}/messages`;
    }

    /**
     * Send a text message via Meta WhatsApp Cloud API
     */
    async sendTextMessage(
        to: string,
        text: string
    ): Promise<IMetaSendMessageResponse> {
        if (!this.isConfigured()) {
            logger.warn(`[WhatsAppProvider] ${WHATSAPP_MESSAGES.NOT_CONFIGURED}`);
            throw new Error(WHATSAPP_MESSAGES.NOT_CONFIGURED);
        }

        const cleanPhone = to.replace(/[^0-9]/g, "");

        const url = this.getBaseUrl();
        const payload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: cleanPhone,
            type: "text",
            text: {
                preview_url: false,
                body: text
            }
        };

        const headers = {
            Authorization: `Bearer ${env.WHATSAPP.ACCESS_TOKEN}`,
            "Content-Type": "application/json"
        };

        try {
            logger.info(`[WhatsAppProvider] Sending text message to ${cleanPhone}`);
            const response = await axios.post<IMetaSendMessageResponse>(url, payload, { headers, timeout: 10000 });
            logger.info(`[WhatsAppProvider] Message sent successfully. Meta ID: ${response.data.messages?.[0]?.id}`);
            return response.data;
        } catch (error: any) {
            const errData = error.response?.data?.error || error.message;
            logger.error(`[WhatsAppProvider] Meta API error sending text message:`, errData);
            const err = new Error(`WhatsApp API Error: ${typeof errData === "object" ? errData.message : errData}`) as any;
            if (typeof errData === "object" && errData.code) err.code = String(errData.code);
            err.raw = typeof errData === "object" ? errData : { message: errData };
            throw err;
        }
    }

    /**
     * Send a template message via Meta WhatsApp Cloud API
     */
    async sendTemplateMessage(
        to: string,
        templateName: string,
        languageCode = "en_US",
        parameters: string[] = []
    ): Promise<IMetaSendMessageResponse> {
        if (!this.isConfigured()) {
            logger.warn(`[WhatsAppProvider] ${WHATSAPP_MESSAGES.NOT_CONFIGURED}`);
            throw new Error(WHATSAPP_MESSAGES.NOT_CONFIGURED);
        }

        const cleanPhone = to.replace(/[^0-9]/g, "");

        const url = this.getBaseUrl();

        const components: any[] = [];
        if (parameters.length > 0) {
            components.push({
                type: "body",
                parameters: parameters.map((param) => ({
                    type: "text",
                    text: param
                }))
            });
        }

        const payload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: cleanPhone,
            type: "template",
            template: {
                name: templateName,
                language: {
                    code: languageCode
                },
                components
            }
        };

        const headers = {
            Authorization: `Bearer ${env.WHATSAPP.ACCESS_TOKEN}`,
            "Content-Type": "application/json"
        };

        try {
            logger.info(`[WhatsAppProvider] Sending template '${templateName}' to ${cleanPhone}`);
            const response = await axios.post<IMetaSendMessageResponse>(url, payload, { headers, timeout: 10000 });
            logger.info(`[WhatsAppProvider] Template sent successfully. Meta ID: ${response.data.messages?.[0]?.id}`);
            return response.data;
        } catch (error: any) {
            const errData = error.response?.data?.error || error.message;
            logger.error(`[WhatsAppProvider] Meta API error sending template message:`, errData);
            const err = new Error(`WhatsApp API Error: ${typeof errData === "object" ? errData.message : errData}`) as any;
            if (typeof errData === "object" && errData.code) err.code = String(errData.code);
            err.raw = typeof errData === "object" ? errData : { message: errData };
            throw err;
        }
    }

    /**
     * Verify incoming Meta webhook signature (x-hub-signature-256)
     */
    verifyWebhookSignature(rawBody: Buffer | string, signatureHeader?: string): boolean {
        const appSecret = env.WHATSAPP.META_APP_SECRET;
        if (!appSecret) {
            // Signature check disabled if APP_SECRET is not set
            return true;
        }

        if (!signatureHeader) {
            return false;
        }

        const signature = signatureHeader.replace("sha256=", "");
        const expectedSignature = crypto
            .createHmac("sha256", appSecret)
            .update(rawBody)
            .digest("hex");

        return crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expectedSignature, "hex"));
    }
}

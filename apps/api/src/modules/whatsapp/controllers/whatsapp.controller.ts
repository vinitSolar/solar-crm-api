/**
 * WhatsApp Module — Controller
 *
 * Thin HTTP layer for WhatsApp webhook and messaging API endpoints.
 */

import type { Request, Response, NextFunction } from "express";
import { WHATSAPP_MESSAGES } from "../constants/whatsapp.constants.js";
import type { WhatsAppService } from "../services/whatsapp.service.js";

export class WhatsAppController {
    private readonly service: WhatsAppService;

    constructor(service: WhatsAppService) {
        this.service = service;
    }

    /**
     * GET /webhooks/whatsapp
     * Meta Webhook URL Verification
     */
    verifyWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const mode = req.query["hub.mode"] as string | undefined;
            const token = req.query["hub.verify_token"] as string | undefined;
            const challenge = req.query["hub.challenge"] as string | undefined;

            const validChallenge = this.service.verifyWebhookToken(mode, token, challenge);
            res.status(200).send(validChallenge);
        } catch (error) {
            res.status(403).json({
                success: false,
                message: WHATSAPP_MESSAGES.WEBHOOK_VERIFICATION_FAILED
            });
        }
    };

    /**
     * POST /webhooks/whatsapp
     * Meta Webhook Inbound Message / Status Event Notification
     */
    handleWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const signatureHeader = (req.headers["x-hub-signature-256"] || req.headers["X-Hub-Signature-256"]) as string | undefined;
            const rawBody = (req as any).rawBody || (typeof req.body === "string" ? req.body : JSON.stringify(req.body));

            const isSignatureValid = this.service.verifyWebhookSignature(rawBody, signatureHeader);
            if (!isSignatureValid) {
                res.status(401).json({
                    success: false,
                    message: WHATSAPP_MESSAGES.WEBHOOK_SIGNATURE_INVALID
                });
                return;
            }

            // Instantly respond HTTP 200 to Meta so webhook does not timeout
            res.status(200).json({
                success: true,
                message: WHATSAPP_MESSAGES.WEBHOOK_RECEIVED
            });

            // Process payload asynchronously
            await this.service.processWebhookEvent(req.body);
        } catch (error) {
            next(error);
        }
    };

    /**
     * POST /whatsapp/messages/send-text
     * Send Outbound Text Message
     */
    sendTextMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { to, text } = req.body;
            const tenantUid = (req as any).user?.tenantUid || null;
            const createdBy = (req as any).user?.uid || null;

            const result = await this.service.sendTextMessage(to, text, tenantUid, createdBy);

            res.status(200).json({
                success: true,
                message: WHATSAPP_MESSAGES.SEND_SUCCESS,
                data: result
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * POST /whatsapp/messages/send-template
     * Send Outbound Template Message
     */
    sendTemplateMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { to, templateName, languageCode, parameters } = req.body;
            const tenantUid = (req as any).user?.tenantUid || null;
            const createdBy = (req as any).user?.uid || null;

            const result = await this.service.sendTemplateMessage(
                to,
                templateName,
                languageCode,
                parameters,
                tenantUid,
                createdBy
            );

            res.status(200).json({
                success: true,
                message: WHATSAPP_MESSAGES.SEND_SUCCESS,
                data: result
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * POST /whatsapp/messages/list
     * Paginated WhatsApp Message Logs (following CRM API Rules)
     */
    listMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const tenantUid = (req as any).user?.tenantUid || null;
            const filter = req.body;

            const result = await this.service.getPaginatedMessages(filter, tenantUid);

            res.status(200).json({
                success: true,
                message: WHATSAPP_MESSAGES.MESSAGES_FETCHED,
                data: result.messages,
                meta: result.meta
            });
        } catch (error) {
            next(error);
        }
    };
}

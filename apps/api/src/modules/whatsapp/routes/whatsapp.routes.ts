/**
 * WhatsApp Module — Routes
 *
 * Route definitions for WhatsApp webhooks (unauthenticated) and API endpoints (authenticated).
 */

import { Router } from "express";
import { authenticate } from "../../auth/middleware/auth.middleware.js";
import { validateRequest } from "../../../middlewares/validate-request.js";
import { WhatsAppController } from "../controllers/whatsapp.controller.js";
import { WhatsAppProvider } from "../providers/whatsapp.provider.js";
import { WhatsAppRepository } from "../repositories/whatsapp.repository.js";
import { WhatsAppService } from "../services/whatsapp.service.js";
import {
    listWhatsAppMessagesSchema,
    sendTemplateMessageSchema,
    sendTextMessageSchema
} from "../validators/whatsapp.validator.js";

/**
 * Route factory for WhatsApp module
 */
export function createWhatsAppRouter(): { webhookRouter: Router; apiRouter: Router } {
    const provider = new WhatsAppProvider();
    const repository = new WhatsAppRepository();
    const service = new WhatsAppService(provider, repository);
    const controller = new WhatsAppController(service);

    // Unauthenticated Webhook Router (mounted at /webhooks/whatsapp)
    const webhookRouter = Router();
    webhookRouter.get("/", controller.verifyWebhook);
    webhookRouter.post("/", controller.handleWebhook);

    // Authenticated Management Router (mounted at /api/v1/whatsapp)
    const apiRouter = Router();

    // Unauthenticated Webhook endpoints under /api/v1/whatsapp/webhook
    apiRouter.get("/webhook", controller.verifyWebhook);
    apiRouter.post("/webhook", controller.handleWebhook);

    // Authenticated endpoints below
    apiRouter.use(authenticate);

    apiRouter.post(
        "/messages/send-text",
        validateRequest(sendTextMessageSchema),
        controller.sendTextMessage
    );

    apiRouter.post(
        "/messages/send-template",
        validateRequest(sendTemplateMessageSchema),
        controller.sendTemplateMessage
    );

    apiRouter.post(
        "/messages/list",
        validateRequest(listWhatsAppMessagesSchema),
        controller.listMessages
    );

    return { webhookRouter, apiRouter };
}

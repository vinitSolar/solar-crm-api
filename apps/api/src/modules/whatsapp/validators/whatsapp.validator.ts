/**
 * WhatsApp Module — Validators
 *
 * Zod validation schemas for API requests, compatible with validateRequest middleware.
 */

import { z } from "zod";

/**
 * Validation for sending a plain text WhatsApp message
 */
export const sendTextMessageSchema = z.object({
    body: z.object({
        to: z
            .string()
            .min(10, "Phone number must be at least 10 digits")
            .max(15, "Phone number cannot exceed 15 digits"),
        text: z
            .string()
            .min(1, "Message text cannot be empty")
            .max(4096, "Message text cannot exceed 4096 characters")
    })
});

/**
 * Validation for sending a template WhatsApp message
 */
export const sendTemplateMessageSchema = z.object({
    body: z.object({
        to: z
            .string()
            .min(10, "Phone number must be at least 10 digits")
            .max(15, "Phone number cannot exceed 15 digits"),
        templateName: z
            .string()
            .min(1, "Template name cannot be empty"),
        languageCode: z.string().optional().default("en_US"),
        parameters: z.array(z.string()).optional().default([])
    })
});

/**
 * Validation for POST /whatsapp/messages/list (paginated search)
 */
export const listWhatsAppMessagesSchema = z.object({
    body: z.object({
        page: z.number().int().positive().optional().default(1),
        limit: z.number().int().positive().max(100).optional().default(20),
        search: z.string().optional().default(""),
        direction: z.enum(["inbound", "outbound", "all"]).optional().default("all"),
        status: z.string().optional().default("all")
    })
});

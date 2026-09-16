/**
 * Notification Module — Template Helper
 *
 * Loads notification templates from static files and compiles
 * placeholder variables into the HTML and subject strings.
 */

import fs from "fs";
import path from "path";
import { logger } from "@packages/logger/logger.js";
import { NOTIFICATION_TEMPLATE, NOTIFICATION_MESSAGES } from "../constants/notification.constants.js";
import { quotationGeneratedTemplate } from "../templates/quotation-generated/template.js";
import { paymentReceivedTemplate } from "../templates/payment-received/template.js";
import { passwordResetTemplate } from "../templates/password-reset/template.js";
import { franchiseCredentialsTemplate } from "../templates/franchise-credentials/template.js";
import { quotationFailedTemplate } from "../templates/quotation-failed/template.js";
import type { ITemplateConfig } from "../interfaces/notification.interfaces.js";

/**
 * Resolves template configuration (HTML path, subject, required keys) for a given template key.
 */
export function getTemplateConfig(template: NOTIFICATION_TEMPLATE): ITemplateConfig {
    switch (template) {
        case NOTIFICATION_TEMPLATE.QUOTATION_GENERATED:
            return {
                subject: quotationGeneratedTemplate.subject,
                htmlPath: quotationGeneratedTemplate.getHtmlPath(),
                requiredKeys: quotationGeneratedTemplate.requiredKeys
            };
        case NOTIFICATION_TEMPLATE.QUOTATION_FAILED:
            return {
                subject: quotationFailedTemplate.subject,
                htmlPath: quotationFailedTemplate.getHtmlPath(),
                requiredKeys: quotationFailedTemplate.requiredKeys
            };
        case NOTIFICATION_TEMPLATE.PAYMENT_RECEIVED:
            return {
                subject: paymentReceivedTemplate.subject,
                htmlPath: paymentReceivedTemplate.getHtmlPath(),
                requiredKeys: paymentReceivedTemplate.requiredKeys
            };
        case NOTIFICATION_TEMPLATE.PASSWORD_RESET:
            return {
                subject: passwordResetTemplate.subject,
                htmlPath: passwordResetTemplate.getHtmlPath(),
                requiredKeys: passwordResetTemplate.requiredKeys
            };
        case NOTIFICATION_TEMPLATE.FRANCHISE_CREDENTIALS:
            return {
                subject: franchiseCredentialsTemplate.subject,
                htmlPath: franchiseCredentialsTemplate.getHtmlPath(),
                requiredKeys: franchiseCredentialsTemplate.requiredKeys
            };
        default:
            throw new Error(`${NOTIFICATION_MESSAGES.TEMPLATE_NOT_FOUND}: ${template}`);
    }
}

/**
 * Loads raw HTML content from the template file path.
 * Includes automatic fallback for production builds when running from dist/
 */
export function loadTemplateHtml(htmlPath: string): string {
    let resolvedPath = htmlPath;

    if (!fs.existsSync(resolvedPath)) {
        // Fallback 1: If running from dist, check corresponding source file in apps/api/src/
        const srcPath = resolvedPath.replace(/([\\\/])dist([\\\/])/, "$1");
        if (fs.existsSync(srcPath)) {
            resolvedPath = srcPath;
        } else {
            // Fallback 2: Check relative to process.cwd()
            const relativePath = path.resolve(
                process.cwd(),
                "apps/api/src/modules/notification/templates",
                path.basename(path.dirname(htmlPath)),
                path.basename(htmlPath)
            );
            if (fs.existsSync(relativePath)) {
                resolvedPath = relativePath;
            }
        }
    }

    if (!fs.existsSync(resolvedPath)) {
        const message = `${NOTIFICATION_MESSAGES.TEMPLATE_LOAD_FAILED} path: ${htmlPath}`;
        logger.error(message);
        throw new Error(message);
    }

    return fs.readFileSync(resolvedPath, "utf-8");
}

/**
 * Compiles a template string by replacing:
 * 1. Conditional blocks: {{#if key}}...{{/if}}
 * 2. Simple placeholders: {{key}}
 *
 * @param html      Raw template string (HTML or subject)
 * @param variables Key-value map of placeholder replacements
 * @returns         Compiled string with all placeholders resolved
 */
export function compileTemplate(html: string, variables: Record<string, string>): string {
    let compiled = html;

    // 1. Process conditional {{#if key}} ... {{/if}} blocks
    const ifRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
    compiled = compiled.replace(ifRegex, (_, key: string, content: string) => {
        const value = variables[key];
        return value ? content : "";
    });

    // 2. Process standard {{key}} replacements
    const placeholderRegex = /\{\{(\w+)\}\}/g;
    compiled = compiled.replace(placeholderRegex, (_, key: string) => {
        return variables[key] !== undefined ? String(variables[key]) : "";
    });

    return compiled;
}

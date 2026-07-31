/**
 * Notification Module — Email Provider
 *
 * Low-level Nodemailer transport for sending emails.
 * This provider is channel-specific and only handles SMTP delivery.
 * It does NOT log to the database — that responsibility belongs to the service/dispatcher layer.
 */

import nodemailer from "nodemailer";
import type nodemailerTypes from "nodemailer";
import { env } from "@packages/config/index.js";
import { logger } from "@packages/logger/logger.js";
import { NOTIFICATION_MESSAGES } from "../constants/notification.constants.js";

class EmailProvider {
    private transporter: nodemailerTypes.Transporter | null = null;

    /**
     * Returns the singleton Nodemailer transporter, creating it on first call.
     */
    private getTransporter(): nodemailerTypes.Transporter {
        if (!this.transporter) {
            const host = env.MAIL.HOST;
            const port = env.MAIL.PORT;
            const user = env.MAIL.USER;
            const pass = env.MAIL.PASSWORD;

            // Port 465 is implicit TLS; all others use STARTTLS
            const secure = port === 465;

            logger.info(`Initializing Email Provider SMTP transporter: ${host}:${port} (secure: ${secure})`);

            this.transporter = nodemailer.createTransport({
                host,
                port,
                secure,
                auth: {
                    user,
                    pass
                }
            });
        }
        return this.transporter;
    }

    /**
     * Sends an email using the configured SMTP transport.
     *
     * @param to      Recipient email address
     * @param subject Resolved email subject line
     * @param html    Compiled HTML body
     */
    async sendEmail(to: string, subject: string, html: string): Promise<void> {
        const transporter = this.getTransporter();
        const from = env.MAIL.FROM;

        logger.info(`EmailProvider: Sending email to ${to} [Subject: ${subject}]`);

        await transporter.sendMail({ from, to, subject, html });

        logger.info(`${NOTIFICATION_MESSAGES.EMAIL_SEND_SUCCESS} [To: ${to}]`);
    }
}

/** Singleton email provider instance */
export const emailProvider = new EmailProvider();

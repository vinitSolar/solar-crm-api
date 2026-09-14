/**
 * Notification Module — Email Provider
 *
 * Channel-specific provider handling email delivery strictly using Nodemailer with Gmail.
 * It does NOT log to the database — that responsibility belongs to the service/dispatcher layer.
 */

import nodemailer from "nodemailer";
import type nodemailerTypes from "nodemailer";
import { env } from "@packages/config/index.js";
import { logger } from "@packages/logger/logger.js";
import { NOTIFICATION_MESSAGES } from "../constants/notification.constants.js";

class EmailProvider {
    private transporter: nodemailerTypes.Transporter | null = null;
    private isVerified: boolean = false;

    /**
     * Returns the singleton Nodemailer transporter.
     * Uses Nodemailer's built-in Gmail service for maximum compatibility on Render.
     */
    private getTransporter(): nodemailerTypes.Transporter {
        if (!this.transporter) {
            const host = env.MAIL.HOST || "smtp.gmail.com";
            const port = env.MAIL.PORT || 587;
            const user = env.MAIL.USER;
            const pass = env.MAIL.PASSWORD;

            const isGmail = host.includes("gmail.com") || user?.includes("@gmail.com");
            const secure = port === 465;

            logger.info(`Initializing Nodemailer (User: ${user}, isGmail: ${isGmail})`);

            if (isGmail) {
                // Nodemailer's official built-in Gmail service preset
                this.transporter = nodemailer.createTransport({
                    service: "gmail",
                    auth: {
                        user,
                        pass,
                    },
                    pool: true,
                    maxConnections: 5,
                    maxMessages: 100,
                });
            } else {
                this.transporter = nodemailer.createTransport({
                    host,
                    port,
                    secure,
                    auth: user && pass ? { user, pass } : undefined,
                    connectionTimeout: 15000,
                    greetingTimeout: 15000,
                    socketTimeout: 20000,
                });
            }
        }
        return this.transporter;
    }

    /**
     * Verifies the Nodemailer SMTP connection to Gmail.
     */
    async verifyConnection(): Promise<boolean> {
        if (this.isVerified) return true;

        try {
            const transporter = this.getTransporter();
            await transporter.verify();
            logger.info("Nodemailer: Gmail connection successfully established and verified.");
            this.isVerified = true;
            return true;
        } catch (error: any) {
            logger.error(`Nodemailer verification failed: ${error.message}`, {
                errorCode: error.code,
                command: error.command,
                response: error.response,
            });
            return false;
        }
    }

    /**
     * Sends an email using Nodemailer with Gmail.
     *
     * @param to      Recipient email address
     * @param subject Resolved email subject line
     * @param html    Compiled HTML body
     */
    async sendEmail(to: string, subject: string, html: string): Promise<void> {
        const transporter = this.getTransporter();
        const from = env.MAIL.FROM || env.MAIL.USER;

        logger.info(`Nodemailer: Sending email to ${to} [Subject: ${subject}]`);

        try {
            const info = await transporter.sendMail({ from, to, subject, html });
            logger.info(`${NOTIFICATION_MESSAGES.EMAIL_SEND_SUCCESS} [To: ${to}, MessageId: ${info?.messageId}]`);
        } catch (error: any) {
            logger.error(`Nodemailer failed to send email to ${to}: ${error.message}`, {
                errorCode: error.code,
                command: error.command,
                response: error.response,
                responseCode: error.responseCode,
            });
            throw error;
        }
    }
}

/** Singleton email provider instance */
export const emailProvider = new EmailProvider();


/**
 * Notification Module — Email Provider
 *
 * Channel-specific provider handling email delivery strictly using Nodemailer with Gmail.
 * It does NOT log to the database — that responsibility belongs to the service/dispatcher layer.
 */

import dns from "node:dns";
import nodemailer from "nodemailer";
import type nodemailerTypes from "nodemailer";
import { env } from "@packages/config/index.js";
import { logger } from "@packages/logger/logger.js";
import { NOTIFICATION_MESSAGES } from "../constants/notification.constants.js";

// Ensure Node.js prioritizes IPv4 over IPv6 to prevent ENETUNREACH in containerized cloud environments like Render
if (typeof dns.setDefaultResultOrder === "function") {
    dns.setDefaultResultOrder("ipv4first");
}

class EmailProvider {
    private transporter: nodemailerTypes.Transporter | null = null;
    private isVerified: boolean = false;

    /**
     * Returns the singleton Nodemailer transporter.
     * Uses explicit host/port with family: 4 (IPv4) to avoid IPv6 ENETUNREACH on cloud containers.
     */
    private getTransporter(): nodemailerTypes.Transporter {
        if (!this.transporter) {
            const host = env.MAIL.HOST || "smtp.gmail.com";
            const port = Number(env.MAIL.PORT) || 587;
            const user = env.MAIL.USER;
            const pass = env.MAIL.PASSWORD ? env.MAIL.PASSWORD.replace(/\s+/g, "") : undefined;

            const isGmail = host.includes("gmail.com") || (user ? user.includes("@gmail.com") : false);
            const resolvedHost = isGmail ? "smtp.gmail.com" : host;
            const secure = port === 465;

            logger.info(`Initializing Nodemailer (User: ${user}, Host: ${resolvedHost}, Port: ${port}, Secure: ${secure})`);

            this.transporter = nodemailer.createTransport({
                host: resolvedHost,
                port,
                secure,
                family: 4, // Force IPv4 to prevent ENETUNREACH on Render/Docker environments without IPv6 routing
                auth: user && pass ? { user, pass } : undefined,
                connectionTimeout: 8000,
                greetingTimeout: 8000,
                socketTimeout: 10000,
            } as any);
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


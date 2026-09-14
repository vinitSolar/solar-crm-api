/**
 * Notification Module — Email Provider
 *
 * Channel-specific provider handling email delivery.
 * Supports both Resend API (HTTP-based, recommended for cloud platforms like Render where SMTP ports are blocked)
 * and Nodemailer SMTP (for local development or environments with open SMTP egress).
 *
 * It does NOT log to the database — that responsibility belongs to the service/dispatcher layer.
 */

import nodemailer from "nodemailer";
import type nodemailerTypes from "nodemailer";
import { Resend } from "resend";
import { env } from "@packages/config/index.js";
import { logger } from "@packages/logger/logger.js";
import { NOTIFICATION_MESSAGES } from "../constants/notification.constants.js";

export type EmailServiceType = "nodemailer" | "smtp" | "resend" | "auto";

class EmailProvider {
    private transporter: nodemailerTypes.Transporter | null = null;
    private resendClient: Resend | null = null;
    private isVerified: boolean = false;
    private overrideProvider: "nodemailer" | "resend" | null = null;

    /**
     * Determines which email delivery service is active based on environment variable (MAIL_PROVIDER).
     * 
     * - MAIL_PROVIDER=nodemailer (or smtp) -> Uses Nodemailer
     * - MAIL_PROVIDER=resend              -> Uses Resend HTTP API
     * - MAIL_PROVIDER=auto                -> Uses Resend if RESEND_API_KEY is present, otherwise Nodemailer
     */
    getActiveService(): "nodemailer" | "resend" {
        if (this.overrideProvider) {
            return this.overrideProvider;
        }

        const envVal = (process.env.MAIL_PROVIDER || env.MAIL.PROVIDER || "").toLowerCase();

        if (envVal === "nodemailer" || envVal === "smtp") {
            return "nodemailer";
        }

        if (envVal === "resend") {
            return "resend";
        }

        // Auto fallback: use Resend if API key is provided, otherwise Nodemailer
        const resendKey = process.env.RESEND_API_KEY || env.MAIL.RESEND_API_KEY;
        if (resendKey) {
            return "resend";
        }

        return "nodemailer";
    }

    /**
     * Programmatically override the email service at runtime (e.g. for testing).
     */
    setProvider(provider: EmailServiceType | null): void {
        if (!provider || provider === "auto") {
            this.overrideProvider = null;
        } else if (provider.toLowerCase() === "nodemailer" || provider.toLowerCase() === "smtp") {
            this.overrideProvider = "nodemailer";
        } else {
            this.overrideProvider = "resend";
        }
        this.isVerified = false;
        logger.info(`EmailProvider: Active email service switched to ${this.getActiveService().toUpperCase()}`);
    }

    private shouldUseResend(): boolean {
        return this.getActiveService() === "resend";
    }

    /**
     * Returns the singleton Resend client, creating it on first call.
     */
    private getResendClient(): Resend {
        if (!this.resendClient) {
            const apiKey = env.MAIL.RESEND_API_KEY;
            if (!apiKey) {
                throw new Error("RESEND_API_KEY is missing from environment variables.");
            }
            logger.info("Initializing Email Provider using Resend HTTP API (Render compliant)");
            this.resendClient = new Resend(apiKey);
        }
        return this.resendClient;
    }

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
                auth: user && pass ? { user, pass } : undefined,
                connectionTimeout: 10000,
                greetingTimeout: 10000,
                socketTimeout: 15000,
            });
        }
        return this.transporter;
    }

    /**
     * Verifies the email transport connection.
     * Useful for startup health checks and diagnostics.
     */
    async verifyConnection(): Promise<boolean> {
        if (this.isVerified) return true;

        if (this.shouldUseResend()) {
            if (!env.MAIL.RESEND_API_KEY) {
                logger.error("Email Provider verification failed: RESEND_API_KEY is not configured.");
                return false;
            }
            logger.info("Email Provider verified: Ready to send emails via Resend HTTP API.");
            this.isVerified = true;
            return true;
        }

        try {
            const transporter = this.getTransporter();
            await transporter.verify();
            logger.info("Email Provider verified: SMTP connection successfully established.");
            this.isVerified = true;
            return true;
        } catch (error: any) {
            const isPortBlocked =
                error.code === "ETIMEDOUT" ||
                error.code === "ECONNREFUSED" ||
                error.code === "ESOCKETTIMEDOUT" ||
                error.code === "EHOSTUNREACH";

            logger.error(`Email Provider SMTP verification failed: ${error.message}`, {
                errorCode: error.code,
                command: error.command,
                host: env.MAIL.HOST,
                port: env.MAIL.PORT,
                renderNotice: isPortBlocked
                    ? "Outbound SMTP port blocked. Render's Free/Starter plan restricts outbound SMTP (ports 25, 465, 587). Please set RESEND_API_KEY in Render to send via HTTPS API."
                    : undefined,
            });
            return false;
        }
    }

    /**
     * Sends an email using either Resend API or Nodemailer SMTP based on configuration.
     *
     * @param to      Recipient email address
     * @param subject Resolved email subject line
     * @param html    Compiled HTML body
     */
    async sendEmail(to: string, subject: string, html: string): Promise<void> {
        const from = env.MAIL.FROM;

        if (this.shouldUseResend()) {
            await this.sendViaResend(to, subject, html, from);
        } else {
            await this.sendViaSmtp(to, subject, html, from);
        }
    }

    /**
     * Sends email via Resend HTTPS REST API (Port 443 — works seamlessly on Render).
     */
    private async sendViaResend(to: string, subject: string, html: string, from: string): Promise<void> {
        const client = this.getResendClient();
        logger.info(`EmailProvider [Resend]: Sending email to ${to} [Subject: ${subject}]`);

        try {
            const { data, error } = await client.emails.send({
                from,
                to: [to],
                subject,
                html,
            });

            if (error) {
                logger.error(`EmailProvider [Resend] dispatch error: ${error.message}`, {
                    recipient: to,
                    subject,
                    errorName: error.name,
                });
                throw new Error(`Resend Error: ${error.message}`);
            }

            logger.info(`${NOTIFICATION_MESSAGES.EMAIL_SEND_SUCCESS} [To: ${to}, Resend ID: ${data?.id}]`);
        } catch (error: any) {
            logger.error(`EmailProvider [Resend] request failed: ${error.message}`, {
                recipient: to,
                subject,
                error,
            });
            throw error;
        }
    }

    /**
     * Sends email via Nodemailer SMTP with detailed diagnostic logging.
     */
    private async sendViaSmtp(to: string, subject: string, html: string, from: string): Promise<void> {
        const transporter = this.getTransporter();
        logger.info(`EmailProvider [SMTP]: Sending email to ${to} [Subject: ${subject}]`);

        try {
            await transporter.sendMail({ from, to, subject, html });
            logger.info(`${NOTIFICATION_MESSAGES.EMAIL_SEND_SUCCESS} [To: ${to}]`);
        } catch (error: any) {
            const isPortBlocked =
                error.code === "ETIMEDOUT" ||
                error.code === "ECONNREFUSED" ||
                error.code === "ESOCKETTIMEDOUT" ||
                error.code === "EHOSTUNREACH";

            logger.error(`EmailProvider [SMTP] failed to send email: ${error.message}`, {
                recipient: to,
                subject,
                errorCode: error.code,
                command: error.command,
                response: error.response,
                responseCode: error.responseCode,
                renderNotice: isPortBlocked
                    ? "Outbound SMTP blocked on Render (ports 25, 465, 587 are blocked on Render free plan). Add RESEND_API_KEY in Render environment variables to switch to Resend API over port 443."
                    : undefined,
            });

            throw error;
        }
    }
}

/** Singleton email provider instance */
export const emailProvider = new EmailProvider();

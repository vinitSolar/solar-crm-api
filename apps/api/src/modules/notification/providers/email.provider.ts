/**
 * Notification Module — Email Provider
 *
 * Channel-specific provider handling email delivery.
 * Supports:
 * 1. Brevo HTTP API (Port 443 over HTTPS) — recommended for cloud platforms like Render
 *    where outbound SMTP ports (587/465/25) are blocked.
 * 2. Nodemailer SMTP (direct IPv4) — fallback when Brevo is not configured.
 *
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
     * Checks whether Brevo HTTP API is configured and should be used.
     */
    private isBrevoEnabled(): boolean {
        return Boolean(env.MAIL.BREVO_API_KEY && env.MAIL.BREVO_API_KEY.trim().length > 0);
    }

    /**
     * Returns the singleton Nodemailer transporter.
     * Pre-resolves the host to IPv4 to bypass Nodemailer's internal dual-stack resolver
     * which randomly picks unreachable IPv6 addresses on cloud containers.
     */
    private async getTransporter(): Promise<nodemailerTypes.Transporter> {
        if (!this.transporter) {
            const host = env.MAIL.HOST || "smtp.gmail.com";
            const port = Number(env.MAIL.PORT) || 587;
            const user = env.MAIL.USER;
            const pass = env.MAIL.PASSWORD ? env.MAIL.PASSWORD.replace(/\s+/g, "") : undefined;

            const isGmail = host.includes("gmail.com") || (user ? user.includes("@gmail.com") : false);
            const resolvedHost = isGmail ? "smtp.gmail.com" : host;
            const secure = port === 465;

            // Pre-resolve IPv4 address directly so Nodemailer never attempts IPv6 connections
            let targetHost = resolvedHost;
            try {
                const ipv4Addresses = await dns.promises.resolve4(resolvedHost);
                if (ipv4Addresses && ipv4Addresses.length > 0 && ipv4Addresses[0]) {
                    targetHost = ipv4Addresses[0];
                    logger.info(`Nodemailer pre-resolved ${resolvedHost} to IPv4: ${targetHost}`);
                }
            } catch (dnsError: any) {
                logger.warn(`Could not pre-resolve IPv4 for ${resolvedHost}: ${dnsError.message}. Using hostname.`);
            }

            logger.info(`Initializing Nodemailer (User: ${user}, TargetHost: ${targetHost}, Port: ${port}, Secure: ${secure})`);

            this.transporter = nodemailer.createTransport({
                host: targetHost,
                port,
                secure,
                tls: {
                    servername: resolvedHost, // Preserves SSL/TLS hostname verification against smtp.gmail.com
                },
                auth: user && pass ? { user, pass } : undefined,
                connectionTimeout: 8000,
                greetingTimeout: 8000,
                socketTimeout: 10000,
            } as any);
        }
        return this.transporter;
    }

    /**
     * Verifies the email provider configuration and connectivity.
     */
    async verifyConnection(): Promise<boolean> {
        if (this.isVerified) return true;

        // 1. If Brevo HTTP API is configured, verify via Brevo API
        if (this.isBrevoEnabled()) {
            try {
                logger.info("Verifying Brevo HTTP API credentials...");
                const response = await fetch("https://api.brevo.com/v3/account", {
                    method: "GET",
                    headers: {
                        accept: "application/json",
                        "api-key": env.MAIL.BREVO_API_KEY!.trim(),
                    },
                });

                if (!response.ok) {
                    const errBody = await response.json().catch(() => ({}));
                    throw new Error(errBody.message || `Brevo HTTP API returned status ${response.status}`);
                }

                logger.info("Brevo HTTP API: Account and credentials successfully verified.");
                this.isVerified = true;
                return true;
            } catch (error: any) {
                logger.error(`Brevo HTTP API verification failed: ${error.message}`);
                return false;
            }
        }

        // 2. Otherwise verify Nodemailer SMTP connection
        try {
            const transporter = await this.getTransporter();
            await transporter.verify();
            logger.info("Nodemailer: SMTP connection successfully established and verified.");
            this.isVerified = true;
            return true;
        } catch (error: any) {
            logger.error(`Nodemailer verification failed: ${error.message}`, {
                errorCode: error.code,
                command: error.command,
                response: error.response,
            });
            this.transporter = null;
            return false;
        }
    }

    /**
     * Sends an email via Brevo HTTP API (Port 443 over HTTPS).
     */
    private async sendViaBrevo(to: string, subject: string, html: string): Promise<void> {
        const senderEmail = env.MAIL.FROM || env.MAIL.USER || "noreply@sunselect.com";
        const senderName = env.APP.NAME || "SunSelect Solar";

        logger.info(`Brevo HTTP API: Sending email to ${to} [Subject: ${subject}] from ${senderEmail}`);

        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
                accept: "application/json",
                "api-key": env.MAIL.BREVO_API_KEY!.trim(),
                "content-type": "application/json",
            },
            body: JSON.stringify({
                sender: {
                    name: senderName,
                    email: senderEmail,
                },
                to: [
                    {
                        email: to,
                    },
                ],
                subject,
                htmlContent: html,
            }),
        });

        if (!response.ok) {
            const errorBody: any = await response.json().catch(() => ({}));
            const message = errorBody?.message || `Brevo API returned HTTP ${response.status}`;
            logger.error(`Brevo HTTP API failed to send email to ${to}: ${message}`);
            throw new Error(`Brevo HTTP API failed: ${message}`);
        }

        const data: any = await response.json().catch(() => ({}));
        logger.info(`${NOTIFICATION_MESSAGES.EMAIL_SEND_SUCCESS} [To: ${to}, MessageId: ${data?.messageId || "brevo-ok"}]`);
    }

    /**
     * Sends an email via Nodemailer SMTP.
     */
    private async sendViaNodemailer(to: string, subject: string, html: string): Promise<void> {
        const transporter = await this.getTransporter();
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
            this.transporter = null;
            throw error;
        }
    }

    /**
     * Sends an email using the active provider.
     * Uses Brevo HTTP API (Port 443) if configured; otherwise uses Nodemailer SMTP.
     *
     * @param to      Recipient email address
     * @param subject Resolved email subject line
     * @param html    Compiled HTML body
     */
    async sendEmail(to: string, subject: string, html: string): Promise<void> {
        if (this.isBrevoEnabled()) {
            await this.sendViaBrevo(to, subject, html);
        } else {
            await this.sendViaNodemailer(to, subject, html);
        }
    }
}

/** Singleton email provider instance */
export const emailProvider = new EmailProvider();

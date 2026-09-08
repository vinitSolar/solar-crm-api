/**
 * Notification Module — Push Provider (FCM Mobile: Android & iOS)
 *
 * Uses Firebase Admin SDK to deliver real-time push notifications
 * exclusively to native Android and iOS mobile applications.
 *
 * Firebase is initialized strictly once as a singleton.
 * Automatic token pruning deactivates invalid/unregistered FCM tokens.
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getMessaging, type MulticastMessage, type SendResponse } from "firebase-admin/messaging";
import { env } from "@packages/config/index.js";
import { logger } from "@packages/logger/index.js";
import { DeviceTokenRepository } from "../../users/repositories/device-token.repository.js";
import pool from "@packages/connection.js";
import {
    NOTIFICATION_TEMPLATE,
    NOTIFICATION_MESSAGES
} from "../constants/notification.constants.js";
import type { ISendNotificationPayload } from "../interfaces/notification.interfaces.js";

class PushProvider {
    private isInitialized = false;
    private isAvailable = false;
    private readonly deviceTokenRepository: DeviceTokenRepository;

    constructor() {
        this.deviceTokenRepository = new DeviceTokenRepository(pool);
    }

    /**
     * Initializes the Firebase Admin SDK once.
     * If credentials are not configured, logs a warning and marks as unavailable.
     */
    private initialize(): boolean {
        if (this.isInitialized) {
            return this.isAvailable;
        }
        this.isInitialized = true;

        const projectId = env.FIREBASE?.PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
        const clientEmail = env.FIREBASE?.CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL;
        let privateKey = env.FIREBASE?.PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY;

        if (!projectId || !clientEmail || !privateKey) {
            logger.warn(NOTIFICATION_MESSAGES.PUSH_NOT_CONFIGURED);
            this.isAvailable = false;
            return false;
        }

        try {
            // Handle escaped newlines in environment variable
            privateKey = privateKey.replace(/\\n/g, "\n");

            if (getApps().length === 0) {
                initializeApp({
                    credential: cert({
                        projectId,
                        clientEmail,
                        privateKey,
                    }),
                });
            }

            this.isAvailable = true;
            logger.info("Firebase Admin SDK initialized successfully for mobile push notifications (Android / iOS).");
            return true;
        } catch (error) {
            logger.error("Failed to initialize Firebase Admin SDK:", error);
            this.isAvailable = false;
            return false;
        }
    }

    /**
     * Resolves notification Title, Body and Data payload based on the notification template.
     */
    private formatContent(payload: ISendNotificationPayload): { title: string; body: string; data: Record<string, string> } {
        const v = payload.variables || {};

        switch (payload.template) {
            case NOTIFICATION_TEMPLATE.LEAD_ASSIGNED: {
                const leadNumber = v.lead_number || "Lead";
                const customerName = v.customer_name || "Customer";
                const systemSize = v.system_size ? ` (${v.system_size})` : "";
                
                return {
                    title: "New Lead Assigned",
                    body: `You have been assigned lead ${leadNumber} - ${customerName}${systemSize}.`,
                    data: {
                        module: payload.module,
                        referenceUid: payload.referenceUid,
                        leadNumber,
                        customerName,
                        click_action: "FLUTTER_NOTIFICATION_CLICK"
                    }
                };
            }
            default:
                return {
                    title: v.title || "SunSelect Solar Notification",
                    body: v.body || v.message || "You have a new update in SunSelect Solar CRM.",
                    data: {
                        module: payload.module,
                        referenceUid: payload.referenceUid,
                        click_action: "FLUTTER_NOTIFICATION_CLICK"
                    }
                };
        }
    }

    /**
     * Sends a push notification to all active Android & iOS mobile devices of the recipient user.
     *
     * @param payload Notification payload containing recipient user UID and variables
     */
    async sendPush(payload: ISendNotificationPayload): Promise<void> {
        const isReady = this.initialize();
        if (!isReady) {
            logger.info(`Push notification skipped (Firebase not configured) [User: ${payload.recipient}, Module: ${payload.module}]`);
            return;
        }

        const userUid = payload.recipient;
        const tenantUid = payload.tenantUid;

        // 1. Fetch active mobile device tokens (Android / iOS)
        const deviceTokens = await this.deviceTokenRepository.getActiveTokensByUser(tenantUid, userUid);

        if (!deviceTokens || deviceTokens.length === 0) {
            logger.info(`${NOTIFICATION_MESSAGES.PUSH_NO_DEVICE_TOKENS} [User: ${userUid}, Module: ${payload.module}]`);
            return;
        }

        const registrationTokens = deviceTokens.map(t => t.deviceToken);
        const { title, body, data } = this.formatContent(payload);

        // 2. Build multicast FCM message for mobile devices
        const multicastMessage: MulticastMessage = {
            tokens: registrationTokens,
            notification: {
                title,
                body,
            },
            data,
            android: {
                priority: "high",
                notification: {
                    sound: "default",
                    channelId: "crm_high_priority_notifications",
                    clickAction: "FLUTTER_NOTIFICATION_CLICK",
                }
            },
            apns: {
                payload: {
                    aps: {
                        sound: "default",
                        badge: 1,
                        contentAvailable: true,
                    }
                }
            }
        };

        try {
            logger.info(`Sending FCM push notification to ${registrationTokens.length} device(s) [User: ${userUid}]`);
            const response = await getMessaging().sendEachForMulticast(multicastMessage);

            logger.info(`FCM response: ${response.successCount} succeeded, ${response.failureCount} failed [User: ${userUid}]`);

            // 3. Deactivate stale/invalid tokens
            if (response.failureCount > 0) {
                const invalidTokens: string[] = [];
                response.responses.forEach((resp: SendResponse, idx: number) => {
                    if (!resp.success && resp.error) {
                        const errorCode = resp.error.code;
                        if (
                            errorCode === "messaging/registration-token-not-registered" ||
                            errorCode === "messaging/invalid-registration-token" ||
                            errorCode === "messaging/invalid-argument"
                        ) {
                            const staleToken = registrationTokens[idx];
                            if (staleToken) {
                                invalidTokens.push(staleToken);
                            }
                        }
                    }
                });

                if (invalidTokens.length > 0) {
                    logger.info(`Pruning ${invalidTokens.length} invalid/unregistered FCM token(s)...`);
                    await this.deviceTokenRepository.deactivateInvalidTokens(invalidTokens);
                }
            }
        } catch (error) {
            logger.error(`Failed to send FCM push notification [User: ${userUid}]:`, error);
            throw error;
        }
    }
}

export const pushProvider = new PushProvider();

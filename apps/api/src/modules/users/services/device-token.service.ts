import type { DeviceTokenRepository, IRegisterDeviceTokenInput, IUserDeviceToken } from "../repositories/device-token.repository.js";
import type { UserRepository } from "../repositories/user.repository.js";
import { notificationService, NOTIFICATION_CHANNEL, NOTIFICATION_TEMPLATE } from "../../notification/index.js";
import { pushProvider } from "../../notification/providers/push.provider.js";
import { CustomError } from "../../../middlewares/error.middleware.js";
import { DEVICE_TOKEN_MESSAGES } from "../constants/device-token.constants.js";
import { logger } from "@packages/logger/index.js";

export interface ISendPushNotificationOptions {
    title?: string;
    body?: string;
    template?: "TEST_PUSH" | "LEAD_ASSIGNED";
    leadNumber?: string;
    customerName?: string;
    systemSize?: string;
    city?: string;
}

export interface ISendPushNotificationResult {
    delivered: boolean;
    firebaseConfigured: boolean;
    activeDevices: number;
    recipientUserUid: string;
    recipientName: string;
    logUid?: string;
    message: string;
}

export class DeviceTokenService {
    private readonly repository: DeviceTokenRepository;
    private readonly userRepository: UserRepository;

    constructor(repository: DeviceTokenRepository, userRepository: UserRepository) {
        this.repository = repository;
        this.userRepository = userRepository;
    }

    async registerToken(
        tenantUid: string,
        userUid: string,
        data: IRegisterDeviceTokenInput,
        createdBy: string
    ): Promise<IUserDeviceToken> {
        logger.info("DeviceTokenService.registerToken", { tenantUid, userUid, deviceType: data.deviceType });
        return this.repository.upsertToken(tenantUid, userUid, data, createdBy);
    }

    async removeToken(tenantUid: string, userUid: string, deviceToken: string): Promise<boolean> {
        logger.info("DeviceTokenService.removeToken", { tenantUid, userUid });
        return this.repository.deactivateToken(tenantUid, userUid, deviceToken);
    }

    async sendPushNotification(
        tenantUid: string | undefined,
        targetUserUid: string,
        options: ISendPushNotificationOptions,
        createdBy: string
    ): Promise<ISendPushNotificationResult> {
        logger.info("DeviceTokenService.sendPushNotification", { tenantUid, targetUserUid, options });

        // 1. Verify target user exists
        const user = await this.userRepository.getUserByUid(targetUserUid, tenantUid);
        if (!user) {
            throw new CustomError(DEVICE_TOKEN_MESSAGES.USER_NOT_FOUND, 404);
        }

        const effectiveTenantUid = tenantUid || user.tenantUid;
        const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "User";

        // 2. Check active device tokens for the recipient user
        const activeTokens = await this.repository.getActiveTokensByUser(effectiveTenantUid, targetUserUid);
        const activeDevicesCount = activeTokens.length;

        // 3. Check Firebase status
        const isFirebaseConfigured = pushProvider.isConfigured();

        if (!isFirebaseConfigured) {
            logger.warn("Push notification aborted: Firebase is not configured in environment.");
            return {
                delivered: false,
                firebaseConfigured: false,
                activeDevices: activeDevicesCount,
                recipientUserUid: targetUserUid,
                recipientName: fullName,
                message: DEVICE_TOKEN_MESSAGES.FIREBASE_NOT_CONFIGURED
            };
        }

        if (activeDevicesCount === 0) {
            logger.info(`Push notification skipped: User ${targetUserUid} has no active device tokens.`);
            return {
                delivered: false,
                firebaseConfigured: true,
                activeDevices: 0,
                recipientUserUid: targetUserUid,
                recipientName: fullName,
                message: DEVICE_TOKEN_MESSAGES.NO_ACTIVE_TOKENS
            };
        }

        // 4. Resolve template and variables
        const selectedTemplate = options.template === "LEAD_ASSIGNED"
            ? NOTIFICATION_TEMPLATE.LEAD_ASSIGNED
            : NOTIFICATION_TEMPLATE.TEST_PUSH;

        const variables: Record<string, string> = {
            title: options.title || "SunSelect Notification",
            body: options.body || "This is a push notification from SunSelect Solar CRM.",
            lead_number: options.leadNumber || "SS00001",
            customer_name: options.customerName || fullName,
            system_size: options.systemSize || "5 kW",
            city: options.city || "Head Office",
            lead_uid: targetUserUid
        };

        // 5. Dispatch notification
        const result = await notificationService.send({
            channel: NOTIFICATION_CHANNEL.PUSH,
            template: selectedTemplate,
            recipient: targetUserUid,
            module: "user",
            referenceUid: targetUserUid,
            tenantUid: effectiveTenantUid,
            createdBy,
            variables
        });

        logger.info("DeviceTokenService.sendPushNotification success", {
            targetUserUid,
            activeDevices: activeDevicesCount,
            logUid: result.logUid
        });

        return {
            delivered: result.success,
            firebaseConfigured: true,
            activeDevices: activeDevicesCount,
            recipientUserUid: targetUserUid,
            recipientName: fullName,
            logUid: result.logUid,
            message: DEVICE_TOKEN_MESSAGES.PUSH_SENT_SUCCESS
        };
    }
}

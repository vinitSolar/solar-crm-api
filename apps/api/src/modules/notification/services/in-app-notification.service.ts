/**
 * Notification Module — In-App Notification Service
 *
 * Business logic for in-app notification center operations.
 */

import { InAppNotificationRepository } from "../repositories/in-app-notification.repository.js";
import { toNotificationSafe } from "../dto/in-app-notification.dto.js";
import { CustomError } from "../../../middlewares/error.middleware.js";
import { IN_APP_NOTIFICATION_MESSAGES } from "../constants/in-app-notification.constants.js";
import type {
    ICreateInAppNotification,
    IGetNotificationsFilter,
    INotificationSafe,
    IPaginatedNotifications
} from "../interfaces/in-app-notification.interface.js";

export class InAppNotificationService {
    private readonly repository: InAppNotificationRepository;

    constructor(repository?: InAppNotificationRepository) {
        this.repository = repository ?? new InAppNotificationRepository();
    }

    /**
     * Retrieves paginated notifications for the specified user and tenant.
     */
    async getNotificationsPaginated(
        tenantUid: string,
        userUid: string,
        filter: IGetNotificationsFilter
    ): Promise<IPaginatedNotifications> {
        const page = filter.page && filter.page > 0 ? filter.page : 1;
        const limit = filter.limit && filter.limit > 0 ? filter.limit : 20;

        const result = await this.repository.getPaginated(tenantUid, userUid, {
            ...filter,
            page,
            limit
        });

        return {
            data: result.rows.map(toNotificationSafe),
            meta: {
                total: result.total,
                page,
                limit,
                totalPages: Math.ceil(result.total / limit)
            }
        };
    }

    /**
     * Gets the total unread notification count for the user.
     */
    async getUnreadCount(tenantUid: string, userUid: string): Promise<number> {
        return this.repository.getUnreadCount(tenantUid, userUid);
    }

    /**
     * Marks an individual notification as read.
     */
    async markAsRead(tenantUid: string, userUid: string, uid: string): Promise<INotificationSafe> {
        const updated = await this.repository.markAsRead(tenantUid, userUid, uid);
        if (!updated) {
            const existing = await this.repository.getByUid(tenantUid, userUid, uid);
            if (!existing) {
                throw new CustomError(IN_APP_NOTIFICATION_MESSAGES.NOT_FOUND, 404);
            }
            return toNotificationSafe(existing);
        }
        return toNotificationSafe(updated);
    }

    /**
     * Marks all unread notifications for a user as read.
     */
    async markAllAsRead(tenantUid: string, userUid: string): Promise<{ updatedCount: number }> {
        const updatedCount = await this.repository.markAllAsRead(tenantUid, userUid);
        return { updatedCount };
    }

    /**
     * Soft deletes a notification.
     */
    async deleteNotification(
        tenantUid: string,
        userUid: string,
        uid: string,
        deletedBy: string
    ): Promise<void> {
        const deleted = await this.repository.softDelete(tenantUid, userUid, uid, deletedBy);
        if (!deleted) {
            throw new CustomError(IN_APP_NOTIFICATION_MESSAGES.NOT_FOUND, 404);
        }
    }

    /**
     * Restores a soft-deleted notification.
     */
    async restoreNotification(tenantUid: string, userUid: string, uid: string): Promise<void> {
        const restored = await this.repository.restore(tenantUid, userUid, uid);
        if (!restored) {
            throw new CustomError(IN_APP_NOTIFICATION_MESSAGES.NOT_FOUND, 404);
        }
    }

    /**
     * Creates an in-app notification directly.
     */
    async createNotification(data: ICreateInAppNotification): Promise<INotificationSafe> {
        const created = await this.repository.createNotification(data);
        return toNotificationSafe(created);
    }
}

export const inAppNotificationService = new InAppNotificationService();

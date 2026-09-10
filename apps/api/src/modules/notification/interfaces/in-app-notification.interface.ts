/**
 * Notification Module — In-App Notification Interfaces
 */

import type { InAppReadStatus, InAppStatusFilter } from "../constants/in-app-notification.constants.js";

export interface INotification {
    id: string;
    uid: string;
    tenantUid: string;
    userUid: string;
    title: string;
    body: string;
    module: string;
    referenceUid: string | null;
    template: string | null;
    data: Record<string, unknown>;
    isRead: number;
    readAt: Date | null;
    isActive: number;
    isDeleted: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    createdBy: string | null;
    updatedBy: string | null;
    deletedBy: string | null;
}

export interface INotificationSafe {
    uid: string;
    title: string;
    body: string;
    module: string;
    referenceUid: string | null;
    template: string | null;
    data: Record<string, unknown>;
    isRead: boolean;
    readAt: Date | null;
    createdAt: Date;
    isDeleted: boolean;
}

export interface ICreateInAppNotification {
    tenantUid: string;
    userUid: string;
    title: string;
    body: string;
    module?: string;
    referenceUid?: string | null;
    template?: string | null;
    data?: Record<string, unknown>;
    createdBy?: string | null;
}

export interface IGetNotificationsFilter {
    page?: number;
    limit?: number;
    search?: string;
    readStatus?: InAppReadStatus;
    status?: InAppStatusFilter;
}

export interface IPaginatedNotifications {
    data: INotificationSafe[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

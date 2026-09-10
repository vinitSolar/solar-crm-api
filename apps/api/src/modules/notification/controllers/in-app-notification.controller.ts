/**
 * Notification Module — In-App Notification Controller
 *
 * Thin controller forwarding validated requests to InAppNotificationService.
 */

import type { Request, Response, NextFunction } from "express";
import type { InAppNotificationService } from "../services/in-app-notification.service.js";
import type { IAuthenticatedRequest } from "../../auth/interfaces/auth.interface.js";
import { IN_APP_NOTIFICATION_MESSAGES } from "../constants/in-app-notification.constants.js";

export class InAppNotificationController {
    private readonly service: InAppNotificationService;

    constructor(service: InAppNotificationService) {
        this.service = service;
    }

    /**
     * Lists paginated notifications for the authenticated user.
     */
    listNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const userUid = authReq.user.uid;

            const result = await this.service.getNotificationsPaginated(
                tenantUid,
                userUid,
                req.body
            );

            res.status(200).json({
                success: true,
                message: IN_APP_NOTIFICATION_MESSAGES.FETCHED_SUCCESSFULLY,
                data: result.data,
                meta: result.meta
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Retrieves the count of unread notifications for the authenticated user.
     */
    getUnreadCount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const userUid = authReq.user.uid;

            const unreadCount = await this.service.getUnreadCount(tenantUid, userUid);

            res.status(200).json({
                success: true,
                message: IN_APP_NOTIFICATION_MESSAGES.UNREAD_COUNT_FETCHED,
                data: { unreadCount }
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Marks an individual notification as read.
     */
    markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const userUid = authReq.user.uid;
            const uid = req.params.uid as string;

            const notification = await this.service.markAsRead(tenantUid, userUid, uid);

            res.status(200).json({
                success: true,
                message: IN_APP_NOTIFICATION_MESSAGES.MARKED_AS_READ,
                data: notification
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Marks all unread notifications for the authenticated user as read.
     */
    markAllAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const userUid = authReq.user.uid;

            const result = await this.service.markAllAsRead(tenantUid, userUid);

            res.status(200).json({
                success: true,
                message: IN_APP_NOTIFICATION_MESSAGES.ALL_MARKED_AS_READ,
                data: result
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Soft deletes a notification.
     */
    deleteNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const userUid = authReq.user.uid;
            const uid = req.params.uid as string;

            await this.service.deleteNotification(tenantUid, userUid, uid, userUid);

            res.status(200).json({
                success: true,
                message: IN_APP_NOTIFICATION_MESSAGES.DELETED_SUCCESSFULLY,
                data: null
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Restores a soft-deleted notification.
     */
    restoreNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const userUid = authReq.user.uid;
            const uid = req.params.uid as string;

            await this.service.restoreNotification(tenantUid, userUid, uid);

            res.status(200).json({
                success: true,
                message: IN_APP_NOTIFICATION_MESSAGES.RESTORED_SUCCESSFULLY,
                data: null
            });
        } catch (error) {
            next(error);
        }
    };
}

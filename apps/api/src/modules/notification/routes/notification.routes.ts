/**
 * Notification Module — Routes
 *
 * RESTful routes for In-App Notification Center.
 */

import { Router } from "express";
import { InAppNotificationController } from "../controllers/in-app-notification.controller.js";
import { InAppNotificationService } from "../services/in-app-notification.service.js";
import { InAppNotificationRepository } from "../repositories/in-app-notification.repository.js";
import {
    listNotificationsSchema,
    notificationUidParamSchema,
    validateNotificationBody,
    validateNotificationParams
} from "../validators/in-app-notification.validator.js";
import { authenticate } from "../../auth/middleware/auth.middleware.js";
import pool from "@packages/connection.js";

export function createNotificationRouter(): Router {
    const router = Router();

    const repository = new InAppNotificationRepository(pool);
    const service = new InAppNotificationService(repository);
    const controller = new InAppNotificationController(service);

    router.use(authenticate);

    /**
     * @swagger
     * /notifications/list:
     *   post:
     *     tags: [Notifications]
     *     summary: Get paginated notifications
     *     description: Retrieves a paginated list of notifications for the currently authenticated user.
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: false
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               page:
     *                 type: integer
     *                 default: 1
     *                 example: 1
     *               limit:
     *                 type: integer
     *                 default: 20
     *                 example: 20
     *               search:
     *                 type: string
     *                 description: Search term across notification title and body.
     *                 example: "lead"
     *               readStatus:
     *                 type: string
     *                 enum: [all, unread, read]
     *                 default: all
     *                 example: "all"
     *               status:
     *                 type: string
     *                 enum: [active, deleted, all]
     *                 default: active
     *                 example: "active"
     *     responses:
     *       200:
     *         description: Notifications list retrieved successfully.
     *       401:
     *         description: Unauthorized.
     */
    router.post(
        "/list",
        validateNotificationBody(listNotificationsSchema),
        controller.listNotifications
    );

    /**
     * @swagger
     * /notifications/unread-count:
     *   get:
     *     tags: [Notifications]
     *     summary: Get unread notification count
     *     description: Returns the total count of unread notifications for the authenticated user to display on the bell badge.
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Unread count retrieved successfully.
     *       401:
     *         description: Unauthorized.
     */
    router.get(
        "/unread-count",
        controller.getUnreadCount
    );

    /**
     * @swagger
     * /notifications/read-all:
     *   put:
     *     tags: [Notifications]
     *     summary: Mark all notifications as read
     *     description: Marks all unread notifications of the authenticated user as read.
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: All notifications marked as read successfully.
     *       401:
     *         description: Unauthorized.
     */
    router.put(
        "/read-all",
        controller.markAllAsRead
    );

    /**
     * @swagger
     * /notifications/{uid}/read:
     *   put:
     *     tags: [Notifications]
     *     summary: Mark single notification as read
     *     description: Marks a specific notification as read by its UID.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: uid
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       200:
     *         description: Notification marked as read successfully.
     *       404:
     *         description: Notification not found.
     */
    router.put(
        "/:uid/read",
        validateNotificationParams(notificationUidParamSchema),
        controller.markAsRead
    );

    /**
     * @swagger
     * /notifications/{uid}/restore:
     *   put:
     *     tags: [Notifications]
     *     summary: Restore a soft-deleted notification
     *     description: Restores a soft-deleted notification by UID.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: uid
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       200:
     *         description: Notification restored successfully.
     *       404:
     *         description: Notification not found.
     */
    router.put(
        "/:uid/restore",
        validateNotificationParams(notificationUidParamSchema),
        controller.restoreNotification
    );

    /**
     * @swagger
     * /notifications/{uid}:
     *   delete:
     *     tags: [Notifications]
     *     summary: Soft delete a notification
     *     description: Soft deletes a notification by UID.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: uid
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       200:
     *         description: Notification deleted successfully.
     *       404:
     *         description: Notification not found.
     */
    router.delete(
        "/:uid",
        validateNotificationParams(notificationUidParamSchema),
        controller.deleteNotification
    );

    return router;
}

export const notificationRoutes = createNotificationRouter();

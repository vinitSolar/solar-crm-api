import { Router } from "express";
import { UserPermissionController } from "../controllers/user-permission.controller.js";
import { UserPermissionService } from "../services/user-permission.service.js";
import { UserPermissionRepository } from "../repositories/user-permission.repository.js";
import { UserRepository } from "../../users/repositories/user.repository.js";
import { MenuRepository } from "../../menus/repositories/menu.repository.js";
import {
    getMenuPermissionsSchema,
    upsertMenuPermissionsSchema,
    validateUserPermissionRequest,
} from "../validators/user-permission.validator.js";
import { authenticate } from "../../auth/middleware/auth.middleware.js";
import pool from "@packages/connection.js";

/**
 * User Permission module route factory.
 */
function createUserPermissionRouter(): Router {
    const router = Router();

    // Dependency injection
    const userPermissionRepository = new UserPermissionRepository(pool);
    const userRepository = new UserRepository(pool);
    const menuRepository = new MenuRepository(pool);
    const userPermissionService = new UserPermissionService(
        userPermissionRepository,
        userRepository,
        menuRepository,
    );
    const userPermissionController = new UserPermissionController(userPermissionService);

    /**
     * @swagger
     * /users/{userUid}/menu-permissions:
     *   get:
     *     tags: [User Permissions]
     *     summary: Get overridden menu permissions for a user
     *     description: Returns the user-specific overridden permissions.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: userUid
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *         description: The user UID
     *     responses:
     *       200:
     *         description: User menu permissions fetched successfully
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/SuccessResponse'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       type: object
     *                       properties:
     *                         menus:
     *                           type: array
     *                           items:
     *                             $ref: '#/components/schemas/UserMenuPermissionSafe'
     *       401:
     *         description: Unauthorized
     *       404:
     *         description: User not found
     */
    router.get(
        "/:userUid/menu-permissions",
        authenticate,
        validateUserPermissionRequest(getMenuPermissionsSchema),
        userPermissionController.getMenuPermissions,
    );

    /**
     * @swagger
     * /users/{userUid}/menu-permissions:
     *   put:
     *     tags: [User Permissions]
     *     summary: Override menu permissions for a user
     *     description: Bulk upsert menu permissions for a user. Replaces all existing user-specific permissions atomically.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: userUid
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [permissions]
     *             properties:
     *               permissions:
     *                 type: array
     *                 items:
     *                   type: object
     *                   required: [menuUid, canView, canCreate, canEdit, canDelete]
     *                   properties:
     *                     menuUid:
     *                       type: string
     *                       format: uuid
     *                     canView:
     *                       type: integer
     *                       enum: [0, 1]
     *                     canCreate:
     *                       type: integer
     *                       enum: [0, 1]
     *                     canEdit:
     *                       type: integer
     *                       enum: [0, 1]
     *                     canDelete:
     *                       type: integer
     *                       enum: [0, 1]
     *     responses:
     *       200:
     *         description: User menu permissions updated successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/SuccessResponse'
     *       400:
     *         description: Validation failed
     *       401:
     *         description: Unauthorized
     *       404:
     *         description: User or menu not found
     */
    router.put(
        "/:userUid/menu-permissions",
        authenticate,
        validateUserPermissionRequest(upsertMenuPermissionsSchema),
        userPermissionController.upsertMenuPermissions,
    );

    return router;
}

export const userPermissionRoutes = createUserPermissionRouter();

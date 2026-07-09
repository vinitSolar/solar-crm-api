import { Router } from "express";
import { RolePermissionController } from "../controllers/role-permission.controller.js";
import { RolePermissionService } from "../services/role-permission.service.js";
import { RolePermissionRepository } from "../repositories/role-permission.repository.js";
import { RoleRepository } from "../../roles/repositories/role.repository.js";
import { MenuRepository } from "../../menus/repositories/menu.repository.js";
import {
    getMenuPermissionsSchema,
    upsertMenuPermissionsSchema,
    validateRolePermissionRequest,
} from "../validators/role-permission.validator.js";
import { authenticate } from "../../auth/middleware/auth.middleware.js";
import pool from "@packages/connection.js";

/**
 * Role Permission module route factory.
 *
 * Wires up the dependency chain:
 * Pool → Repositories → Service → Controller → Routes
 */
function createRolePermissionRouter(): Router {
    const router = Router();

    // Dependency injection
    const rolePermissionRepository = new RolePermissionRepository(pool);
    const roleRepository = new RoleRepository(pool);
    const menuRepository = new MenuRepository(pool);
    const rolePermissionService = new RolePermissionService(
        rolePermissionRepository,
        roleRepository,
        menuRepository,
    );
    const rolePermissionController = new RolePermissionController(rolePermissionService);

    /**
     * @swagger
     * /roles/{roleUid}/menu-permissions:
     *   get:
     *     tags: [Role Permissions]
     *     summary: Get menu permissions for a role
     *     description: Returns all menus with their permission flags (can_view, can_create, can_edit, can_delete) for the specified role.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: roleUid
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *         description: The role UID
     *     responses:
     *       200:
     *         description: Role menu permissions fetched successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 message:
     *                   type: string
     *                   example: Role menu permissions fetched successfully
     *                 data:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       menuUid:
     *                         type: string
     *                       menuName:
     *                         type: string
     *                       menuCode:
     *                         type: string
     *                       canView:
     *                         type: integer
     *                         example: 1
     *                       canCreate:
     *                         type: integer
     *                         example: 1
     *                       canEdit:
     *                         type: integer
     *                         example: 1
     *                       canDelete:
     *                         type: integer
     *                         example: 0
     *       401:
     *         description: Unauthorized
     *       404:
     *         description: Role not found
     */
    router.get(
        "/:roleUid/menu-permissions",
        authenticate,
        validateRolePermissionRequest(getMenuPermissionsSchema),
        rolePermissionController.getMenuPermissions,
    );

    /**
     * @swagger
     * /roles/{roleUid}/menu-permissions:
     *   put:
     *     tags: [Role Permissions]
     *     summary: Set menu permissions for a role
     *     description: Bulk upsert menu permissions for a role. Replaces all existing permissions atomically.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: roleUid
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *         description: The role UID
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
     *                       example: 1
     *                     canCreate:
     *                       type: integer
     *                       enum: [0, 1]
     *                       example: 1
     *                     canEdit:
     *                       type: integer
     *                       enum: [0, 1]
     *                       example: 1
     *                     canDelete:
     *                       type: integer
     *                       enum: [0, 1]
     *                       example: 0
     *     responses:
     *       200:
     *         description: Role menu permissions updated successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 message:
     *                   type: string
     *                   example: Role menu permissions updated successfully
     *                 data:
     *                   type: object
     *                   nullable: true
     *       400:
     *         description: Validation failed
     *       401:
     *         description: Unauthorized
     *       404:
     *         description: Role or menu not found
     */
    router.put(
        "/:roleUid/menu-permissions",
        authenticate,
        validateRolePermissionRequest(upsertMenuPermissionsSchema),
        rolePermissionController.upsertMenuPermissions,
    );

    return router;
}

export const rolePermissionRoutes = createRolePermissionRouter();

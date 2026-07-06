import { Router } from "express";
import { RoleController } from "../controllers/role.controller.js";
import { RoleService } from "../services/role.service.js";
import { RoleRepository } from "../repositories/role.repository.js";
import { createRoleSchema, updateRoleSchema, getRoleSchema, deleteRoleSchema, validateRoleRequest, getPaginatedRolesSchema, restoreRoleSchema, getAllRolesSchema } from "../validators/role.validator.js";
import { authenticate } from "../../auth/middleware/auth.middleware.js";
import pool from "@packages/connection.js";

function createRoleRouter(): Router {
    const router = Router();

    // Dependency injection
    const roleRepository = new RoleRepository(pool);
    const roleService = new RoleService(roleRepository);
    const roleController = new RoleController(roleService);

    /**
     * @swagger
     * /roles/list:
     *   post:
     *     tags: [Roles]
     *     summary: Get paginated roles for the authenticated tenant
     *     description: Retrieves a paginated list of all roles for the authenticated tenant.
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
     *                 example: 1
     *               limit:
     *                 type: integer
     *                 example: 10
     *               search:
     *                 type: string
     *               status:
     *                 type: string
     *                 enum: [active, deleted, all]
     *                 example: active
     *     responses:
     *       200:
     *         description: Roles fetched successfully
     *       401:
     *         description: Unauthorized
     */
    router.post(
        "/list",
        authenticate,
        validateRoleRequest(getPaginatedRolesSchema),
        roleController.getRoles,
    );

    /**
     * @swagger
     * /roles/all:
     *   get:
     *     tags: [Roles]
     *     summary: Get all roles (without pagination)
     *     description: Retrieves a list of all roles for the authenticated tenant, useful for dropdowns.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: status
     *         required: false
     *         schema:
     *           type: string
     *           enum: [active, deleted, all]
     *         description: Filter roles by status
     *     responses:
     *       200:
     *         description: Roles fetched successfully
     *       401:
     *         description: Unauthorized
     */
    router.get(
        "/all",
        authenticate,
        validateRoleRequest(getAllRolesSchema),
        roleController.getAllRoles,
    );

    /**
     * @swagger
     * /roles/{uid}:
     *   get:
     *     tags: [Roles]
     *     summary: Get a specific role by UID
     *     description: Retrieves details of a specific role by its UID.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: uid
     *         required: true
     *         schema:
     *           type: string
     *         description: The role UID
     *     responses:
     *       200:
     *         description: Role fetched successfully
     *       401:
     *         description: Unauthorized
     *       404:
     *         description: Role not found
     */
    router.get(
        "/:uid",
        authenticate,
        validateRoleRequest(getRoleSchema),
        roleController.getRoleByUid,
    );

    /**
     * @swagger
     * /roles:
     *   post:
     *     tags: [Roles]
     *     summary: Create a new role
     *     description: Creates a new role for the authenticated tenant.
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [name]
     *             properties:
     *               name:
     *                 type: string
     *                 example: "Admin"
     *               description:
     *                 type: string
     *                 example: "Administrator role"
     *     responses:
     *       201:
     *         description: Role created successfully
     *       400:
     *         description: Validation failed
     *       401:
     *         description: Unauthorized
     */
    router.post(
        "/",
        authenticate,
        validateRoleRequest(createRoleSchema),
        roleController.createRole,
    );

    /**
     * @swagger
     * /roles/{uid}:
     *   put:
     *     tags: [Roles]
     *     summary: Update an existing role
     *     description: Updates the details of an existing role.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: uid
     *         required: true
     *         schema:
     *           type: string
     *         description: The role UID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               name:
     *                 type: string
     *                 example: "Super Admin"
     *               description:
     *                 type: string
     *                 example: "Updated description"
     *               isActive:
     *                 type: integer
     *                 enum: [0, 1]
     *                 example: 1
     *     responses:
     *       200:
     *         description: Role updated successfully
     *       400:
     *         description: Validation failed
     *       401:
     *         description: Unauthorized
     *       404:
     *         description: Role not found
     */
    router.put(
        "/:uid",
        authenticate,
        validateRoleRequest(updateRoleSchema),
        roleController.updateRole,
    );

    /**
     * @swagger
     * /roles/{uid}:
     *   delete:
     *     tags: [Roles]
     *     summary: Delete a role
     *     description: Deletes an existing role by its UID. System roles cannot be deleted.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: uid
     *         required: true
     *         schema:
     *           type: string
     *         description: The role UID
     *     responses:
     *       200:
     *         description: Role deleted successfully
     *       401:
     *         description: Unauthorized
     *       404:
     *         description: Role not found
     */
    router.delete(
        "/:uid",
        authenticate,
        validateRoleRequest(deleteRoleSchema),
        roleController.deleteRole,
    );

    /**
     * @swagger
     * /roles/{uid}/restore:
     *   put:
     *     tags: [Roles]
     *     summary: Restore a deleted role
     *     description: Restores a soft-deleted role by its UID.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: uid
     *         required: true
     *         schema:
     *           type: string
     *         description: The role UID
     *     responses:
     *       200:
     *         description: Role restored successfully
     *       401:
     *         description: Unauthorized
     *       404:
     *         description: Role not found or not deleted
     */
    router.put(
        "/:uid/restore",
        authenticate,
        validateRoleRequest(restoreRoleSchema),
        roleController.restoreRole,
    );

    return router;
}

export const roleRoutes = createRoleRouter();

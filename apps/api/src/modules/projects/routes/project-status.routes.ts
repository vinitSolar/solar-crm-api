import { Router } from "express";
import { ProjectStatusController } from "../controllers/project-status.controller.js";
import { ProjectStatusService } from "../services/project-status.service.js";
import { ProjectStatusRepository } from "../repositories/project-status.repository.js";
import {
    createProjectStatusSchema,
    updateProjectStatusSchema,
    getByUidSchema,
    getAllSchema,
    validateProjectRequest,
} from "../validators/project.validator.js";
import { authenticate } from "../../auth/middleware/auth.middleware.js";
import pool from "@packages/connection.js";

function createProjectStatusRouter(): Router {
    const router = Router();

    const repository = new ProjectStatusRepository(pool);
    const service = new ProjectStatusService(repository);
    const controller = new ProjectStatusController(service);

    router.use(authenticate);

    /**
     * @swagger
     * /project-statuses/all:
     *   get:
     *     tags: [Project Statuses]
     *     summary: Get all project statuses
     *     description: Retrieves a list of all project statuses for the authenticated tenant.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: status
     *         schema:
     *           type: string
     *           enum: [active, deleted, all]
     *         description: Filter by status
     *     responses:
     *       200:
     *         description: Project statuses fetched successfully
     *       401:
     *         description: Unauthorized
     */
    router.get(
        "/all",
        validateProjectRequest(getAllSchema),
        controller.getAllProjectStatuses,
    );

    /**
     * @swagger
     * /project-statuses/{uid}:
     *   get:
     *     tags: [Project Statuses]
     *     summary: Get a project status by UID
     *     description: Retrieves details of a specific project status by its UID.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: uid
     *         required: true
     *         schema:
     *           type: string
     *         description: The UID of the project status
     *     responses:
     *       200:
     *         description: Project status fetched successfully
     *       404:
     *         description: Project status not found
     *       401:
     *         description: Unauthorized
     */
    router.get(
        "/:uid",
        validateProjectRequest(getByUidSchema),
        controller.getProjectStatusByUid,
    );

    /**
     * @swagger
     * /project-statuses:
     *   post:
     *     tags: [Project Statuses]
     *     summary: Create a new project status
     *     description: Creates a new project status in the system.
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - name
     *             properties:
     *               name:
     *                 type: string
     *               color:
     *                 type: string
     *               sortOrder:
     *                 type: integer
     *               isDefault:
     *                 type: integer
     *               isClosed:
     *                 type: integer
     *               description:
     *                 type: string
     *     responses:
     *       201:
     *         description: Project status created successfully
     *       400:
     *         description: Validation error
     *       401:
     *         description: Unauthorized
     */
    router.post(
        "/",
        validateProjectRequest(createProjectStatusSchema),
        controller.createProjectStatus,
    );

    /**
     * @swagger
     * /project-statuses/{uid}:
     *   put:
     *     tags: [Project Statuses]
     *     summary: Update an existing project status
     *     description: Updates the details of an existing project status.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: uid
     *         required: true
     *         schema:
     *           type: string
     *         description: The UID of the project status
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               name:
     *                 type: string
     *               color:
     *                 type: string
     *               sortOrder:
     *                 type: integer
     *               isDefault:
     *                 type: integer
     *               isClosed:
     *                 type: integer
     *               description:
     *                 type: string
     *     responses:
     *       200:
     *         description: Project status updated successfully
     *       400:
     *         description: Validation error
     *       404:
     *         description: Project status not found
     *       401:
     *         description: Unauthorized
     */
    router.put(
        "/:uid",
        validateProjectRequest(updateProjectStatusSchema),
        controller.updateProjectStatus,
    );

    /**
     * @swagger
     * /project-statuses/{uid}:
     *   delete:
     *     tags: [Project Statuses]
     *     summary: Delete a project status
     *     description: Soft deletes a project status by its UID.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: uid
     *         required: true
     *         schema:
     *           type: string
     *         description: The UID of the project status
     *     responses:
     *       200:
     *         description: Project status deleted successfully
     *       404:
     *         description: Project status not found
     *       401:
     *         description: Unauthorized
     */
    router.delete(
        "/:uid",
        validateProjectRequest(getByUidSchema),
        controller.deleteProjectStatus,
    );

    /**
     * @swagger
     * /project-statuses/{uid}/restore:
     *   put:
     *     tags: [Project Statuses]
     *     summary: Restore a deleted project status
     *     description: Restores a soft-deleted project status by its UID.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: uid
     *         required: true
     *         schema:
     *           type: string
     *         description: The UID of the project status
     *     responses:
     *       200:
     *         description: Project status restored successfully
     *       404:
     *         description: Project status not found
     *       401:
     *         description: Unauthorized
     */
    router.put(
        "/:uid/restore",
        validateProjectRequest(getByUidSchema),
        controller.restoreProjectStatus,
    );

    return router;
}

export const projectStatusRoutes = createProjectStatusRouter();

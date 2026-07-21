import { Router } from "express";
import { ProjectController } from "../controllers/project.controller.js";
import { ProjectService } from "../services/project.service.js";
import { ProjectRepository } from "../repositories/project.repository.js";
import { ProjectStatusRepository } from "../repositories/project-status.repository.js";
import { QuotationRepository } from "../../quotations/repositories/quotation.repository.js";
import { AuditLogService } from "../../audit-logs/services/audit-logs.service.js";
import { AuditLogRepository } from "../../audit-logs/repositories/audit-logs.repository.js";
import {
    createProjectSchema,
    updateProjectSchema,
    changeProjectStatusSchema,
    getByUidSchema,
    paginationSchema,
    validateProjectRequest,
} from "../validators/project.validator.js";
import { authenticate } from "../../auth/middleware/auth.middleware.js";
import pool from "@packages/connection.js";

function createProjectRouter(): Router {
    const router = Router();

    const projectRepository = new ProjectRepository(pool);
    const statusRepository = new ProjectStatusRepository(pool);
    const quotationRepository = new QuotationRepository();
    const auditLogRepo = new AuditLogRepository(pool);
    const auditLogService = new AuditLogService(auditLogRepo);

    const service = new ProjectService(
        projectRepository,
        statusRepository,
        quotationRepository,
        auditLogService
    );
    const controller = new ProjectController(service);

    router.use(authenticate);

    /**
     * @swagger
     * /projects/list:
     *   post:
     *     tags: [Projects]
     *     summary: Get paginated projects
     *     description: Retrieves a paginated list of all projects for the authenticated tenant.
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               page:
     *                 type: integer
     *               limit:
     *                 type: integer
     *               search:
     *                 type: string
     *               status:
     *                 type: string
     *                 enum: [active, deleted, all]
     *               projectStatusUid:
     *                 type: string
     *               projectManagerUid:
     *                 type: string
     *               startDate:
     *                 type: string
     *               endDate:
     *                 type: string
     *     responses:
     *       200:
     *         description: Projects fetched successfully
     *       401:
     *         description: Unauthorized
     */
    router.post(
        "/list",
        validateProjectRequest(paginationSchema),
        controller.getProjectsPaginated,
    );

    /**
     * @swagger
     * /projects/{uid}:
     *   get:
     *     tags: [Projects]
     *     summary: Get a project by UID
     *     description: Retrieves details of a specific project by its UID.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: uid
     *         required: true
     *         schema:
     *           type: string
     *         description: The UID of the project
     *     responses:
     *       200:
     *         description: Project fetched successfully
     *       404:
     *         description: Project not found
     *       401:
     *         description: Unauthorized
     */
    router.get(
        "/:uid",
        validateProjectRequest(getByUidSchema),
        controller.getProjectByUid,
    );

    /**
     * @swagger
     * /projects:
     *   post:
     *     tags: [Projects]
     *     summary: Create a new project
     *     description: Creates a new project from an approved quotation.
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - quotationUid
     *               - projectName
     *             properties:
     *               quotationUid:
     *                 type: string
     *               projectName:
     *                 type: string
     *               projectManagerUid:
     *                 type: string
     *               projectDate:
     *                 type: string
     *                 format: date-time
     *               remarks:
     *                 type: string
     *     responses:
     *       201:
     *         description: Project created successfully
     *       400:
     *         description: Validation error or invalid quotation state
     *       401:
     *         description: Unauthorized
     */
    router.post(
        "/",
        validateProjectRequest(createProjectSchema),
        controller.createProject,
    );

    /**
     * @swagger
     * /projects/{uid}:
     *   put:
     *     tags: [Projects]
     *     summary: Update an existing project
     *     description: Updates the details of an existing project.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: uid
     *         required: true
     *         schema:
     *           type: string
     *         description: The UID of the project
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               projectName:
     *                 type: string
     *               projectManagerUid:
     *                 type: string
     *               projectStatusUid:
     *                 type: string
     *               projectDate:
     *                 type: string
     *                 format: date-time
     *               remarks:
     *                 type: string
     *     responses:
     *       200:
     *         description: Project updated successfully
     *       400:
     *         description: Validation error
     *       404:
     *         description: Project not found
     *       401:
     *         description: Unauthorized
     */
    router.put(
        "/:uid",
        validateProjectRequest(updateProjectSchema),
        controller.updateProject,
    );

    /**
     * @swagger
     * /projects/{uid}/status:
     *   put:
     *     tags: [Projects]
     *     summary: Change project status
     *     description: Updates only the status of an existing project.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: uid
     *         required: true
     *         schema:
     *           type: string
     *         description: The UID of the project
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - statusUid
     *             properties:
     *               statusUid:
     *                 type: string
     *     responses:
     *       200:
     *         description: Project status updated successfully
     *       400:
     *         description: Validation error
     *       404:
     *         description: Project or status not found
     *       401:
     *         description: Unauthorized
     */
    router.put(
        "/:uid/status",
        validateProjectRequest(changeProjectStatusSchema),
        controller.changeStatus,
    );

    /**
     * @swagger
     * /projects/{uid}:
     *   delete:
     *     tags: [Projects]
     *     summary: Delete a project
     *     description: Soft deletes a project by its UID.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: uid
     *         required: true
     *         schema:
     *           type: string
     *         description: The UID of the project
     *     responses:
     *       200:
     *         description: Project deleted successfully
     *       404:
     *         description: Project not found
     *       401:
     *         description: Unauthorized
     */
    router.delete(
        "/:uid",
        validateProjectRequest(getByUidSchema),
        controller.deleteProject,
    );

    /**
     * @swagger
     * /projects/{uid}/restore:
     *   put:
     *     tags: [Projects]
     *     summary: Restore a deleted project
     *     description: Restores a soft-deleted project by its UID.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: uid
     *         required: true
     *         schema:
     *           type: string
     *         description: The UID of the project
     *     responses:
     *       200:
     *         description: Project restored successfully
     *       404:
     *         description: Project not found
     *       401:
     *         description: Unauthorized
     */
    router.put(
        "/:uid/restore",
        validateProjectRequest(getByUidSchema),
        controller.restoreProject,
    );

    return router;
}

export const projectRoutes = createProjectRouter();

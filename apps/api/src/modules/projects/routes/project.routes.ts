import { Router } from "express";
import multer from "multer";
import { ProjectController } from "../controllers/project.controller.js";
import { ProjectService } from "../services/project.service.js";
import { ProjectRepository } from "../repositories/project.repository.js";
import { ProjectStatusRepository } from "../repositories/project-status.repository.js";
import { ProjectSubsidyDocumentRepository } from "../repositories/project-subsidy-document.repository.js";
import { QuotationRepository } from "../../quotations/repositories/quotation.repository.js";
import { StateSubsidyRuleRepository } from "../../state-subsidy-rules/repositories/state-subsidy-rule.repository.js";
import { SubsidyRequiredDocumentRepository } from "../../state-subsidy-rules/repositories/subsidy-required-document.repository.js";
import { AuditLogService } from "../../audit-logs/services/audit-logs.service.js";
import { AuditLogRepository } from "../../audit-logs/repositories/audit-logs.repository.js";
import {
    createProjectSchema,
    updateProjectSchema,
    changeProjectStatusSchema,
    assignProjectManagerSchema,
    getByUidSchema,
    paginationSchema,
    validateProjectRequest,
    addSubsidyDocumentSchema,
} from "../validators/project.validator.js";
import { authenticate } from "../../auth/middleware/auth.middleware.js";
import pool from "@packages/connection.js";

function createProjectRouter(): Router {
    const router = Router();
    const upload = multer({
        storage: multer.memoryStorage(),
    });

    const projectRepository = new ProjectRepository(pool);
    const statusRepository = new ProjectStatusRepository(pool);
    const subsidyDocumentRepository = new ProjectSubsidyDocumentRepository(pool);
    const quotationRepository = new QuotationRepository();
    const subsidyRuleRepository = new StateSubsidyRuleRepository(pool);
    const requiredDocRepository = new SubsidyRequiredDocumentRepository(pool);
    const auditLogRepo = new AuditLogRepository(pool);
    const auditLogService = new AuditLogService(auditLogRepo);

    const service = new ProjectService(
        projectRepository,
        statusRepository,
        subsidyDocumentRepository,
        quotationRepository,
        subsidyRuleRepository,
        requiredDocRepository,
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
     * /projects/{uid}/required-subsidy-documents:
     *   get:
     *     tags: [Projects]
     *     summary: Automatically fetch deduplicated required subsidy documents for a project
     *     description: Resolves applied subsidy schemes for the project (or accepts comma-separated subsidyUids) and returns unique required document types.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: uid
     *         required: true
     *         schema:
     *           type: string
     *         description: Project UID
     *       - in: query
     *         name: subsidyUids
     *         required: false
     *         schema:
     *           type: string
     *         description: Optional comma-separated list of subsidy UIDs to override automatic resolution
     *     responses:
     *       200:
     *         description: Deduplicated required subsidy document types fetched successfully
     *       404:
     *         description: Project not found
     */
    router.get(
        "/:uid/required-subsidy-documents",
        validateProjectRequest(getByUidSchema),
        controller.getRequiredSubsidyDocuments,
    );

    /**
     * @swagger
     * /projects/{uid}/subsidy-documents:
     *   post:
     *     tags: [Projects]
     *     summary: Add a subsidy document to a project
     *     description: Adds an uploaded subsidy document to the specified project.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: uid
     *         required: true
     *         schema:
     *           type: string
     *         description: Project UID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - documentTypeUid
     *               - originalName
     *               - fileName
     *               - fileUrl
     *               - mimeType
     *               - fileSize
     *             properties:
     *               documentTypeUid:
     *                 type: string
     *               originalName:
     *                 type: string
     *               fileName:
     *                 type: string
     *               fileUrl:
     *                 type: string
     *               mimeType:
     *                 type: string
     *               fileSize:
     *                 type: integer
     *               remarks:
     *                 type: string
     *     responses:
     *       201:
     *         description: Subsidy document added successfully
     *       400:
     *         description: Validation error
     *       401:
     *         description: Unauthorized
     *       404:
     *         description: Project not found
     */
    router.post(
        "/:uid/subsidy-documents",
        upload.single("file"),
        validateProjectRequest(addSubsidyDocumentSchema),
        controller.addSubsidyDocument,
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
     * /projects/{uid}/assign-manager:
     *   put:
     *     tags: [Projects]
     *     summary: Assign a project manager to a project
     *     description: Assigns a user as the project manager for a specific project.
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
     *               - projectManagerUid
     *             properties:
     *               projectManagerUid:
     *                 type: string
     *     responses:
     *       200:
     *         description: Project manager assigned successfully
     *       400:
     *         description: Validation error
     *       404:
     *         description: Project not found
     *       401:
     *         description: Unauthorized
     */
    router.put(
        "/:uid/assign-manager",
        validateProjectRequest(assignProjectManagerSchema),
        controller.assignProjectManager,
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

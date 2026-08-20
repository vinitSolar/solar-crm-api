import { Router } from "express";
import multer from "multer";
import { ProjectController } from "../controllers/project.controller.js";
import { ProjectService } from "../services/project.service.js";
import { ProjectRepository } from "../repositories/project.repository.js";
import { ProjectStatusRepository } from "../repositories/project-status.repository.js";
import { ProjectInstallationMilestoneRepository } from "../repositories/project-installation-milestone.repository.js";
import { QuotationRepository } from "../../quotations/repositories/quotation.repository.js";
import { StateSubsidyRuleRepository } from "../../state-subsidy-rules/repositories/state-subsidy-rule.repository.js";
import { SubsidyRequiredDocumentRepository } from "../../state-subsidy-rules/repositories/subsidy-required-document.repository.js";
import { LeadRepository } from "../../leads/repositories/lead.repository.js";
import { SubsidyTrackerRepository } from "../../subsidy-trackers/repositories/subsidy-tracker.repository.js";
import { AuditLogService } from "../../audit-logs/services/audit-logs.service.js";
import { AuditLogRepository } from "../../audit-logs/repositories/audit-logs.repository.js";
import { ProjectInstallationMilestoneDocumentRepository } from "../repositories/project-milestone-document.repository.js";
import { NoteService } from "../../notes/services/note.service.js";
import { NoteRepository } from "../../notes/repositories/note.repository.js";
import {
    createProjectSchema,
    updateProjectSchema,
    changeProjectStatusSchema,
    assignProjectManagerSchema,
    getByUidSchema,
    paginationSchema,
    validateProjectRequest,
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
    const milestoneRepository = new ProjectInstallationMilestoneRepository(pool);
    const quotationRepository = new QuotationRepository();
    const subsidyRuleRepository = new StateSubsidyRuleRepository(pool);
    const requiredDocRepository = new SubsidyRequiredDocumentRepository(pool);
    const leadRepository = new LeadRepository(pool);
    const subsidyTrackerRepository = new SubsidyTrackerRepository(pool);
    const auditLogRepo = new AuditLogRepository(pool);
    const auditLogService = new AuditLogService(auditLogRepo);
    const milestoneDocumentRepository = new ProjectInstallationMilestoneDocumentRepository(pool);
    const noteRepository = new NoteRepository(pool);
    const noteService = new NoteService(noteRepository);

    const service = new ProjectService(
        projectRepository,
        statusRepository,
        milestoneRepository,
        quotationRepository,
        subsidyRuleRepository,
        requiredDocRepository,
        leadRepository,
        subsidyTrackerRepository,
        auditLogService,
        milestoneDocumentRepository,
        noteService
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
     *             $ref: '#/components/schemas/paginationSchemaBody'
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
     *             $ref: '#/components/schemas/createProjectSchemaBody'
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
     *             $ref: '#/components/schemas/updateProjectSchemaBody'
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
     *             $ref: '#/components/schemas/changeProjectStatusSchemaBody'
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
     *             $ref: '#/components/schemas/assignProjectManagerSchemaBody'
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

    // --- MILESTONES ---
    
    /**
     * @swagger
     * /projects/{projectUid}/milestones/{milestoneUid}/upload:
     *   post:
     *     tags: [Projects]
     *     summary: Upload a document for a project milestone
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: projectUid
     *         required: true
     *         schema:
     *           type: string
     *       - in: path
     *         name: milestoneUid
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             properties:
     *               file:
     *                 type: string
     *                 format: binary
     *     responses:
     *       200:
     *         description: Document uploaded successfully
     */
    router.post(
        "/:uid/milestones/:milestoneUid/upload",
        upload.single("file"),
        controller.uploadMilestoneDocument
    );

    /**
     * @swagger
     * /projects/{projectUid}/milestones/{milestoneUid}/documents/{documentUid}:
     *   delete:
     *     tags: [Projects]
     *     summary: Delete a document for a project milestone
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: projectUid
     *         required: true
     *         schema:
     *           type: string
     *       - in: path
     *         name: milestoneUid
     *         required: true
     *         schema:
     *           type: string
     *       - in: path
     *         name: documentUid
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Document deleted successfully
     */
    router.delete(
        "/:uid/milestones/:milestoneUid/documents/:documentUid",
        controller.deleteMilestoneDocument
    );

    // --- SUBSIDY DOCUMENTS ---
    router.get(
        "/:projectUid/milestones",
        controller.getProjectMilestones,
    );    router.put(
        "/:projectUid/milestones/:milestoneUid/status",
        controller.updateMilestoneStatus,
    );

    return router;
}

export const projectRoutes = createProjectRouter();

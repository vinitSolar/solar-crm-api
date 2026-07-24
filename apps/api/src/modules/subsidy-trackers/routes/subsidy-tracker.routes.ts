import { Router } from "express";
import multer from "multer";
import { SubsidyTrackerController } from "../controllers/subsidy-tracker.controller.js";
import { SubsidyTrackerService } from "../services/subsidy-tracker.service.js";
import { SubsidyTrackerRepository } from "../repositories/subsidy-tracker.repository.js";
import { ProjectSubsidyDocumentRepository } from "../../projects/repositories/project-subsidy-document.repository.js";
import { AuditLogService } from "../../audit-logs/services/audit-logs.service.js";
import { AuditLogRepository } from "../../audit-logs/repositories/audit-logs.repository.js";
import {
    updateSubsidyTrackerSchema,
    getByUidSchema,
    paginationSchema,
    validateSubsidyTrackerRequest,
} from "../validators/subsidy-tracker.validator.js";
import { authenticate } from "../../auth/middleware/auth.middleware.js";
import pool from "@packages/connection.js";

function createSubsidyTrackerRouter(): Router {
    const router = Router();
    const upload = multer({
        storage: multer.memoryStorage(),
    });

    const repository = new SubsidyTrackerRepository(pool);
    const documentRepository = new ProjectSubsidyDocumentRepository(pool);
    const auditLogRepo = new AuditLogRepository(pool);
    const auditLogService = new AuditLogService(auditLogRepo);

    const service = new SubsidyTrackerService(repository, documentRepository, auditLogService);
    const controller = new SubsidyTrackerController(service);

    router.use(authenticate);

    /**
     * @swagger
     * tags:
     *   name: SubsidyTrackers
     *   description: Subsidy Tracker management
     */

    /**
     * @swagger
     * /subsidy-trackers/list:
     *   post:
     *     tags: [SubsidyTrackers]
     *     summary: Get paginated list of subsidy trackers
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               page:
     *                 type: integer
     *                 default: 1
     *               limit:
     *                 type: integer
     *                 default: 10
     *               search:
     *                 type: string
     *               status:
     *                 type: string
     *                 enum: [active, deleted, all]
     *                 default: active
     *     responses:
     *       200:
     *         description: List fetched successfully
     */
    router.post(
        "/list",
        validateSubsidyTrackerRequest(paginationSchema),
        controller.listPaginated
    );

    /**
     * @swagger
     * /subsidy-trackers/{uid}:
     *   get:
     *     tags: [SubsidyTrackers]
     *     summary: Get a subsidy tracker by UID
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: uid
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Subsidy tracker fetched successfully
     *       404:
     *         description: Not found
     */
    router.get(
        "/:uid",
        validateSubsidyTrackerRequest(getByUidSchema),
        controller.getByUid
    );

    /**
     * @swagger
     * /subsidy-trackers/{uid}:
     *   put:
     *     tags: [SubsidyTrackers]
     *     summary: Update a subsidy tracker
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: uid
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               portalStatus:
     *                 type: integer
     *               netMeterStatus:
     *                 type: integer
     *               portalReferenceNumber:
     *                 type: string
     *               discomReferenceNumber:
     *                 type: string
     *               expectedSubsidyAmount:
     *                 type: number
     *               approvedSubsidyAmount:
     *                 type: number
     *               receivedSubsidyAmount:
     *                 type: number
     *               name:
     *                 type: string
     *               subsidyUid:
     *                 type: string
     *     responses:
     *       200:
     *         description: Subsidy tracker updated successfully
     */
    router.put(
        "/:uid",
        validateSubsidyTrackerRequest(updateSubsidyTrackerSchema),
        controller.update
    );

    /**
     * @swagger
     * /subsidy-trackers/{uid}/documents:
     *   post:
     *     tags: [SubsidyTrackers]
     *     summary: Upload a document for a subsidy tracker
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: uid
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
     *               documentTypeUid:
     *                 type: string
     *               remarks:
     *                 type: string
     *     responses:
     *       201:
     *         description: Document uploaded successfully
     */
    router.post(
        "/:uid/documents",
        upload.single("file"),
        validateSubsidyTrackerRequest(getByUidSchema), // Validate params
        controller.uploadDocument
    );

    /**
     * @swagger
     * /subsidy-trackers/{uid}/documents/{documentUid}:
     *   delete:
     *     tags: [SubsidyTrackers]
     *     summary: Delete a document from a subsidy tracker
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: uid
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
        "/:uid/documents/:documentUid",
        controller.deleteDocument
    );

    return router;
}

export default createSubsidyTrackerRouter();

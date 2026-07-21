import { Router } from "express";
import { SiteSurveyController } from "../controllers/site-survey.controller.js";
import { SiteSurveyService } from "../services/site-survey.service.js";
import { SiteSurveyRepository } from "../repositories/site-survey.repository.js";
import { SiteSurveyDetailsRepository } from "../repositories/site-survey-details.repository.js";
import { SurveyDocumentRepository } from "../../survey-documents/repositories/survey-document.repository.js";
import { SurveyDocumentTypeRepository } from "../../survey-documents/repositories/survey-document-type.repository.js";
import { SurveyDocumentService } from "../../survey-documents/services/survey-document.service.js";
import { SurveyDocumentController } from "../../survey-documents/controllers/survey-document.controller.js";
import { LeadRepository } from "../../leads/repositories/lead.repository.js";
import { UserRepository } from "../../users/repositories/user.repository.js";
import {
    createSiteSurveySchema,
    updateSiteSurveySchema,
    changeSiteSurveyStatusSchema,
    saveDetailsSchema,
    updateDetailsSchema,
    getByUidSchema,
    paginationSchema,
    validateSiteSurveyRequest,
} from "../validators/site-survey.validator.js";
import { 
    uploadDocumentSchema, 
    getSurveyDocumentsSchema, 
    deleteDocumentSchema,
    validateSurveyDocumentRequest 
} from "../../survey-documents/validators/survey-documents.validator.js";
import { authenticate } from "../../auth/middleware/auth.middleware.js";
import pool from "@packages/connection.js";
import multer from "multer";

function createSiteSurveyRouter(): Router {
    const router = Router();

    const repository = new SiteSurveyRepository(pool);
    const detailsRepository = new SiteSurveyDetailsRepository(pool);
    const leadRepository = new LeadRepository(pool);
    const userRepository = new UserRepository(pool);
    
    const service = new SiteSurveyService(repository, detailsRepository, leadRepository, userRepository);
    const controller = new SiteSurveyController(service);

    const documentRepository = new SurveyDocumentRepository(pool);
    const documentTypeRepository = new SurveyDocumentTypeRepository(pool);
    const documentService = new SurveyDocumentService(documentRepository, documentTypeRepository, repository, pool);
    const documentController = new SurveyDocumentController(documentService);

    const upload = multer({
        storage: multer.memoryStorage(),
        limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit for survey docs
    });

    router.use(authenticate);

    /**
     * @swagger
     * /site-surveys/list:
     *   post:
     *     tags: [Site Surveys]
     *     summary: Get paginated site surveys
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
     *               limit:
     *                 type: integer
     *               search:
     *                 type: string
     *               status:
     *                 type: string
     *                 enum: [active, deleted, all]
     *               surveyStatus:
     *                 type: integer
     *               scheduledDate:
     *                 type: string
     *                 format: date
     *               fromDate:
     *                 type: string
     *                 format: date
     *               toDate:
     *                 type: string
     *                 format: date
     *               assignedTo:
     *                 type: string
     *                 format: uuid
     *               leadUid:
     *                 type: string
     *                 format: uuid
     *     responses:
     *       200:
     *         description: Fetched successfully
     */
    router.post(
        "/list",
        validateSiteSurveyRequest(paginationSchema),
        controller.getSiteSurveysPaginated,
    );

    /**
     * @swagger
     * /site-surveys/all:
     *   get:
     *     tags: [Site Surveys]
     *     summary: Get all site surveys
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: status
     *         schema:
     *           type: string
     *           enum: [active, deleted, all]
     *         description: Filter by status (default is active)
     *     responses:
     *       200:
     *         description: Fetched successfully
     */
    router.get(
        "/all",
        controller.getAllSiteSurveys,
    );

    /**
     * @swagger
     * /site-surveys/{uid}:
     *   get:
     *     tags: [Site Surveys]
     *     summary: Get site survey by UID
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
     *         description: Fetched successfully
     */
    router.get(
        "/:uid",
        validateSiteSurveyRequest(getByUidSchema),
        controller.getSiteSurveyByUid,
    );

    /**
     * @swagger
     * /site-surveys:
     *   post:
     *     tags: [Site Surveys]
     *     summary: Create a site survey
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - leadUid
     *               - assignedTo
     *               - scheduledAt
     *             properties:
     *               leadUid:
     *                 type: string
     *                 format: uuid
     *               assignedTo:
     *                 type: string
     *                 format: uuid
     *               scheduledAt:
     *                 type: string
     *                 format: date-time
     *               remarks:
     *                 type: string
     *     responses:
     *       201:
     *         description: Created successfully
     */
    router.post(
        "/",
        validateSiteSurveyRequest(createSiteSurveySchema),
        controller.createSiteSurvey,
    );

    /**
     * @swagger
     * /site-surveys/{uid}:
     *   put:
     *     tags: [Site Surveys]
     *     summary: Update a site survey
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: uid
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
     *             properties:
     *               assignedTo:
     *                 type: string
     *                 format: uuid
     *               scheduledAt:
     *                 type: string
     *                 format: date-time
     *               status:
     *                 type: integer
     *               remarks:
     *                 type: string
     *     responses:
     *       200:
     *         description: Updated successfully
     */
    router.put(
        "/:uid",
        validateSiteSurveyRequest(updateSiteSurveySchema),
        controller.updateSiteSurvey,
    );

    /**
     * @swagger
     * /site-surveys/{uid}/status:
     *   put:
     *     tags: [Site Surveys]
     *     summary: Change the status of a site survey
     *     description: Updates only the status of an existing site survey.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: uid
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
     *             properties:
     *               status:
     *                 type: integer
     *                 description: The new status of the site survey (0=Pending, 1=Completed, 2=Cancelled, 3=Rescheduled)
     *     responses:
     *       200:
     *         description: Status updated successfully
     *       400:
     *         description: Validation error
     *       404:
     *         description: Site survey not found
     */
    router.put(
        "/:uid/status",
        validateSiteSurveyRequest(changeSiteSurveyStatusSchema),
        controller.changeStatus,
    );

    /**
     * @swagger
     * /site-surveys/{uid}:
     *   delete:
     *     tags: [Site Surveys]
     *     summary: Delete a site survey (soft delete)
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
     *         description: Deleted successfully
     */
    router.delete(
        "/:uid",
        validateSiteSurveyRequest(getByUidSchema),
        controller.deleteSiteSurvey,
    );

    /**
     * @swagger
     * /site-surveys/{uid}/restore:
     *   put:
     *     tags: [Site Surveys]
     *     summary: Restore a soft-deleted site survey
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
     *         description: Restored successfully
     */
    router.put(
        "/:uid/restore",
        validateSiteSurveyRequest(getByUidSchema),
        controller.restoreSiteSurvey,
    );

    /**
     * @swagger
     * /site-surveys/{uid}/details:
     *   post:
     *     tags: [Site Surveys]
     *     summary: Save technical specifications for a site survey
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: uid
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
     *             required:
     *               - roofAreaSqft
     *               - shading
     *               - connectionType
     *               - sanctionedLoadKw
     *             properties:
     *               roofAreaSqft:
     *                 type: number
     *               shading:
     *                 type: integer
     *                 enum: [0, 1, 2, 3]
     *               connectionType:
     *                 type: integer
     *                 enum: [0, 1]
     *               sanctionedLoadKw:
     *                 type: number
     *               recommendedKw:
     *                 type: number
     *               needsStructureExtension:
     *                 type: integer
     *                 enum: [0, 1]
     *               needsOptimizer:
     *                 type: integer
     *                 enum: [0, 1]
     *               optimizerCount:
     *                 type: integer
     *               notes:
     *                 type: string
     *     responses:
     *       201:
     *         description: Technical specifications saved successfully
     */
    router.post(
        "/:uid/details",
        validateSiteSurveyRequest(saveDetailsSchema),
        controller.saveSurveyDetails,
    );

    /**
     * @swagger
     * /site-surveys/{uid}/details:
     *   put:
     *     tags: [Site Surveys]
     *     summary: Update technical specifications for a site survey
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: uid
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
     *             properties:
     *               roofAreaSqft:
     *                 type: number
     *               shading:
     *                 type: integer
     *                 enum: [0, 1, 2, 3]
     *               connectionType:
     *                 type: integer
     *                 enum: [0, 1]
     *               sanctionedLoadKw:
     *                 type: number
     *               recommendedKw:
     *                 type: number
     *               needsStructureExtension:
     *                 type: integer
     *                 enum: [0, 1]
     *               needsOptimizer:
     *                 type: integer
     *                 enum: [0, 1]
     *               optimizerCount:
     *                 type: integer
     *               notes:
     *                 type: string
     *     responses:
     *       200:
     *         description: Technical specifications updated successfully
     */
    router.put(
        "/:uid/details",
        validateSiteSurveyRequest(updateDetailsSchema),
        controller.updateSurveyDetails,
    );

    /**
     * @swagger
     * /site-surveys/{uid}/documents:
     *   post:
     *     tags: [Site Surveys]
     *     summary: Upload documents for a site survey
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: uid
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     requestBody:
     *       required: true
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             properties:
     *               document_type_uid:
     *                 type: string
     *                 format: uuid
     *               remarks:
     *                 type: string
     *               documents:
     *                 type: array
     *                 items:
     *                   type: string
     *                   format: binary
     *     responses:
     *       201:
     *         description: Documents uploaded successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 message:
     *                   type: string
     *                 data:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/SiteSurveyDocumentSafe'
     */
    router.post(
        "/:uid/documents",
        upload.array("documents", 10),
        validateSurveyDocumentRequest(uploadDocumentSchema),
        documentController.uploadDocuments,
    );

    /**
     * @swagger
     * /site-surveys/{uid}/documents:
     *   get:
     *     tags: [Site Surveys]
     *     summary: Get all documents for a site survey
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
     *         description: Fetched successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 message:
     *                   type: string
     *                 data:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/SiteSurveyDocumentSafe'
     */
    router.get(
        "/:uid/documents",
        validateSurveyDocumentRequest(getSurveyDocumentsSchema),
        documentController.getDocumentsBySurveyUid,
    );

    /**
     * @swagger
     * /site-surveys/{uid}/documents/{document_uid}:
     *   delete:
     *     tags: [Site Surveys]
     *     summary: Delete a survey document (soft delete)
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: uid
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *       - in: path
     *         name: document_uid
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       200:
     *         description: Deleted successfully
     */
    router.delete(
        "/:uid/documents/:document_uid",
        validateSurveyDocumentRequest(deleteDocumentSchema),
        documentController.deleteDocument,
    );

    return router;
}

export const siteSurveyRoutes = createSiteSurveyRouter();

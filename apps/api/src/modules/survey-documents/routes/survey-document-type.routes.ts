import { Router } from "express";
import { SurveyDocumentTypeController } from "../controllers/survey-document-type.controller.js";
import { SurveyDocumentTypeService } from "../services/survey-document-type.service.js";
import { SurveyDocumentTypeRepository } from "../repositories/survey-document-type.repository.js";
import {
    createSurveyDocumentTypeSchema,
    updateSurveyDocumentTypeSchema,
    getByUidSchema,
    paginationSchema,
    validateSurveyDocumentRequest,
} from "../validators/survey-documents.validator.js";
import { authenticate } from "../../auth/middleware/auth.middleware.js";
import pool from "@packages/connection.js";

function createSurveyDocumentTypeRouter(): Router {
    const router = Router();

    const repository = new SurveyDocumentTypeRepository(pool);
    const service = new SurveyDocumentTypeService(repository);
    const controller = new SurveyDocumentTypeController(service);

    router.use(authenticate);

    /**
     * @swagger
     * /survey-document-types/list:
     *   post:
     *     tags: [Survey Document Types]
     *     summary: Get paginated survey document types
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
     *     responses:
     *       200:
     *         description: Fetched successfully
     */
    router.post(
        "/list",
        validateSurveyDocumentRequest(paginationSchema),
        controller.getPaginatedDocumentTypes,
    );

    /**
     * @swagger
     * /survey-document-types/all:
     *   get:
     *     tags: [Survey Document Types]
     *     summary: Get all survey document types (unpaginated)
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
     *                     $ref: '#/components/schemas/SurveyDocumentTypeSafe'
     */
    router.get(
        "/all",
        controller.getAllDocumentTypes,
    );

    /**
     * @swagger
     * /survey-document-types/{uid}:
     *   get:
     *     tags: [Survey Document Types]
     *     summary: Get survey document type by UID
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
     *                   $ref: '#/components/schemas/SurveyDocumentTypeSafe'
     */
    router.get(
        "/:uid",
        validateSurveyDocumentRequest(getByUidSchema),
        controller.getDocumentTypeByUid,
    );

    /**
     * @swagger
     * /survey-document-types:
     *   post:
     *     tags: [Survey Document Types]
     *     summary: Create a survey document type
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
     *               description:
     *                 type: string
     *               isRequired:
     *                 type: integer
     *                 enum: [0, 1]
     *               allowMultiple:
     *                 type: integer
     *                 enum: [0, 1]
     *               sortOrder:
     *                 type: integer
     *     responses:
     *       201:
     *         description: Created successfully
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
     *                   $ref: '#/components/schemas/SurveyDocumentTypeSafe'
     */
    router.post(
        "/",
        validateSurveyDocumentRequest(createSurveyDocumentTypeSchema),
        controller.createDocumentType,
    );

    /**
     * @swagger
     * /survey-document-types/{uid}:
     *   put:
     *     tags: [Survey Document Types]
     *     summary: Update a survey document type
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
     *               name:
     *                 type: string
     *               description:
     *                 type: string
     *               isRequired:
     *                 type: integer
     *                 enum: [0, 1]
     *               allowMultiple:
     *                 type: integer
     *                 enum: [0, 1]
     *               sortOrder:
     *                 type: integer
     *               isActive:
     *                 type: integer
     *                 enum: [0, 1]
     *     responses:
     *       200:
     *         description: Updated successfully
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
     *                   $ref: '#/components/schemas/SurveyDocumentTypeSafe'
     */
    router.put(
        "/:uid",
        validateSurveyDocumentRequest(updateSurveyDocumentTypeSchema),
        controller.updateDocumentType,
    );

    /**
     * @swagger
     * /survey-document-types/{uid}:
     *   delete:
     *     tags: [Survey Document Types]
     *     summary: Delete a survey document type (soft delete)
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
        validateSurveyDocumentRequest(getByUidSchema),
        controller.deleteDocumentType,
    );

    return router;
}

export const surveyDocumentTypeRoutes = createSurveyDocumentTypeRouter();

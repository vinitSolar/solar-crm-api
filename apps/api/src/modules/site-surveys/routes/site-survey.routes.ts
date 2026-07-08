import { Router } from "express";
import { SiteSurveyController } from "../controllers/site-survey.controller.js";
import { SiteSurveyService } from "../services/site-survey.service.js";
import { SiteSurveyRepository } from "../repositories/site-survey.repository.js";
import { LeadRepository } from "../../leads/repositories/lead.repository.js";
import { UserRepository } from "../../users/repositories/user.repository.js";
import {
    createSiteSurveySchema,
    updateSiteSurveySchema,
    getByUidSchema,
    paginationSchema,
    validateSiteSurveyRequest,
} from "../validators/site-survey.validator.js";
import { authenticate } from "../../auth/middleware/auth.middleware.js";
import pool from "@packages/connection.js";

function createSiteSurveyRouter(): Router {
    const router = Router();

    const repository = new SiteSurveyRepository(pool);
    const leadRepository = new LeadRepository(pool);
    const userRepository = new UserRepository(pool);
    
    const service = new SiteSurveyService(repository, leadRepository, userRepository);
    const controller = new SiteSurveyController(service);

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

    return router;
}

export const siteSurveyRoutes = createSiteSurveyRouter();

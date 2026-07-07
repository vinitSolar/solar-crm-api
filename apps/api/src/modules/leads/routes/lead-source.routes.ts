import { Router } from "express";
import { LeadSourceController } from "../controllers/lead-source.controller.js";
import { LeadSourceService } from "../services/lead-source.service.js";
import { LeadSourceRepository } from "../repositories/lead-source.repository.js";
import {
    createLeadSourceSchema,
    updateLeadSourceSchema,
    getByUidSchema,
    getAllSchema,
    validateLeadRequest,
} from "../validators/lead.validator.js";
import { authenticate } from "../../auth/middleware/auth.middleware.js";
import pool from "@packages/connection.js";

function createLeadSourceRouter(): Router {
    const router = Router();

    const repository = new LeadSourceRepository(pool);
    const service = new LeadSourceService(repository);
    const controller = new LeadSourceController(service);

    router.use(authenticate);

    /**
     * @swagger
     * /lead-sources/all:
     *   get:
     *     tags: [Lead Sources]
     *     summary: Get all lead sources
     *     description: Retrieves a list of all lead sources for the authenticated tenant.
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
     *         description: Lead sources fetched successfully
     *       401:
     *         description: Unauthorized
     */
    router.get(
        "/all",
        validateLeadRequest(getAllSchema),
        controller.getAllLeadSources,
    );

    /**
     * @swagger
     * /lead-sources/{uid}:
     *   get:
     *     tags: [Lead Sources]
     *     summary: Get a lead source by UID
     *     description: Retrieves details of a specific lead source by its UID.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: uid
     *         required: true
     *         schema:
     *           type: string
     *         description: The UID of the lead source
     *     responses:
     *       200:
     *         description: Lead source fetched successfully
     *       404:
     *         description: Lead source not found
     *       401:
     *         description: Unauthorized
     */
    router.get(
        "/:uid",
        validateLeadRequest(getByUidSchema),
        controller.getLeadSourceByUid,
    );

    /**
     * @swagger
     * /lead-sources:
     *   post:
     *     tags: [Lead Sources]
     *     summary: Create a new lead source
     *     description: Creates a new lead source in the system.
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
     *     responses:
     *       201:
     *         description: Lead source created successfully
     *       400:
     *         description: Validation error
     *       401:
     *         description: Unauthorized
     */
    router.post(
        "/",
        validateLeadRequest(createLeadSourceSchema),
        controller.createLeadSource,
    );

    /**
     * @swagger
     * /lead-sources/{uid}:
     *   put:
     *     tags: [Lead Sources]
     *     summary: Update an existing lead source
     *     description: Updates the details of an existing lead source.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: uid
     *         required: true
     *         schema:
     *           type: string
     *         description: The UID of the lead source
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
     *     responses:
     *       200:
     *         description: Lead source updated successfully
     *       400:
     *         description: Validation error
     *       404:
     *         description: Lead source not found
     *       401:
     *         description: Unauthorized
     */
    router.put(
        "/:uid",
        validateLeadRequest(updateLeadSourceSchema),
        controller.updateLeadSource,
    );

    /**
     * @swagger
     * /lead-sources/{uid}:
     *   delete:
     *     tags: [Lead Sources]
     *     summary: Delete a lead source
     *     description: Soft deletes a lead source by its UID.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: uid
     *         required: true
     *         schema:
     *           type: string
     *         description: The UID of the lead source
     *     responses:
     *       200:
     *         description: Lead source deleted successfully
     *       404:
     *         description: Lead source not found
     *       401:
     *         description: Unauthorized
     */
    router.delete(
        "/:uid",
        validateLeadRequest(getByUidSchema),
        controller.deleteLeadSource,
    );

    /**
     * @swagger
     * /lead-sources/{uid}/restore:
     *   put:
     *     tags: [Lead Sources]
     *     summary: Restore a deleted lead source
     *     description: Restores a soft-deleted lead source by its UID.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: uid
     *         required: true
     *         schema:
     *           type: string
     *         description: The UID of the lead source
     *     responses:
     *       200:
     *         description: Lead source restored successfully
     *       404:
     *         description: Lead source not found
     *       401:
     *         description: Unauthorized
     */
    router.put(
        "/:uid/restore",
        validateLeadRequest(getByUidSchema),
        controller.restoreLeadSource,
    );

    return router;
}

export const leadSourceRoutes = createLeadSourceRouter();

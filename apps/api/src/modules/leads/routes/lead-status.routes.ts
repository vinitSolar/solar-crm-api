import { Router } from "express";
import { LeadStatusController } from "../controllers/lead-status.controller.js";
import { LeadStatusService } from "../services/lead-status.service.js";
import { LeadStatusRepository } from "../repositories/lead-status.repository.js";
import {
    createLeadStatusSchema,
    updateLeadStatusSchema,
    getByUidSchema,
    getAllSchema,
    validateLeadRequest,
} from "../validators/lead.validator.js";
import { authenticate } from "../../auth/middleware/auth.middleware.js";
import pool from "@packages/connection.js";

function createLeadStatusRouter(): Router {
    const router = Router();

    const repository = new LeadStatusRepository(pool);
    const service = new LeadStatusService(repository);
    const controller = new LeadStatusController(service);

    router.use(authenticate);

    /**
     * @swagger
     * /lead-statuses/all:
     *   get:
     *     tags: [Lead Statuses]
     *     summary: Get all lead statuses
     *     description: Retrieves a list of all lead statuses for the authenticated tenant.
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
     *         description: Lead statuses fetched successfully
     *       401:
     *         description: Unauthorized
     */
    router.get(
        "/all",
        validateLeadRequest(getAllSchema),
        controller.getAllLeadStatuses,
    );

    /**
     * @swagger
     * /lead-statuses/{uid}:
     *   get:
     *     tags: [Lead Statuses]
     *     summary: Get a lead status by UID
     *     description: Retrieves details of a specific lead status by its UID.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: uid
     *         required: true
     *         schema:
     *           type: string
     *         description: The UID of the lead status
     *     responses:
     *       200:
     *         description: Lead status fetched successfully
     *       404:
     *         description: Lead status not found
     *       401:
     *         description: Unauthorized
     */
    router.get(
        "/:uid",
        validateLeadRequest(getByUidSchema),
        controller.getLeadStatusByUid,
    );

    /**
     * @swagger
     * /lead-statuses:
     *   post:
     *     tags: [Lead Statuses]
     *     summary: Create a new lead status
     *     description: Creates a new lead status in the system.
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
     *     responses:
     *       201:
     *         description: Lead status created successfully
     *       400:
     *         description: Validation error
     *       401:
     *         description: Unauthorized
     */
    router.post(
        "/",
        validateLeadRequest(createLeadStatusSchema),
        controller.createLeadStatus,
    );

    /**
     * @swagger
     * /lead-statuses/{uid}:
     *   put:
     *     tags: [Lead Statuses]
     *     summary: Update an existing lead status
     *     description: Updates the details of an existing lead status.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: uid
     *         required: true
     *         schema:
     *           type: string
     *         description: The UID of the lead status
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
     *     responses:
     *       200:
     *         description: Lead status updated successfully
     *       400:
     *         description: Validation error
     *       404:
     *         description: Lead status not found
     *       401:
     *         description: Unauthorized
     */
    router.put(
        "/:uid",
        validateLeadRequest(updateLeadStatusSchema),
        controller.updateLeadStatus,
    );

    /**
     * @swagger
     * /lead-statuses/{uid}:
     *   delete:
     *     tags: [Lead Statuses]
     *     summary: Delete a lead status
     *     description: Soft deletes a lead status by its UID.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: uid
     *         required: true
     *         schema:
     *           type: string
     *         description: The UID of the lead status
     *     responses:
     *       200:
     *         description: Lead status deleted successfully
     *       404:
     *         description: Lead status not found
     *       401:
     *         description: Unauthorized
     */
    router.delete(
        "/:uid",
        validateLeadRequest(getByUidSchema),
        controller.deleteLeadStatus,
    );

    /**
     * @swagger
     * /lead-statuses/{uid}/restore:
     *   put:
     *     tags: [Lead Statuses]
     *     summary: Restore a deleted lead status
     *     description: Restores a soft-deleted lead status by its UID.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: uid
     *         required: true
     *         schema:
     *           type: string
     *         description: The UID of the lead status
     *     responses:
     *       200:
     *         description: Lead status restored successfully
     *       404:
     *         description: Lead status not found
     *       401:
     *         description: Unauthorized
     */
    router.put(
        "/:uid/restore",
        validateLeadRequest(getByUidSchema),
        controller.restoreLeadStatus,
    );

    return router;
}

export const leadStatusRoutes = createLeadStatusRouter();

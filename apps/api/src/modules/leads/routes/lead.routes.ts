import { Router } from "express";
import { LeadController } from "../controllers/lead.controller.js";
import { LeadService } from "../services/lead.service.js";
import { LeadRepository } from "../repositories/lead.repository.js";
import { LeadSourceRepository } from "../repositories/lead-source.repository.js";
import { LeadStatusRepository } from "../repositories/lead-status.repository.js";
import {
    createLeadSchema,
    updateLeadSchema,
    getByUidSchema,
    paginationSchema,
    changeLeadStatusSchema,
    validateLeadRequest,
} from "../validators/lead.validator.js";
import { authenticate } from "../../auth/middleware/auth.middleware.js";
import pool from "@packages/connection.js";

function createLeadRouter(): Router {
    const router = Router();

    const repository = new LeadRepository(pool);
    const sourceRepository = new LeadSourceRepository(pool);
    const statusRepository = new LeadStatusRepository(pool);
    
    const service = new LeadService(repository, sourceRepository, statusRepository);
    const controller = new LeadController(service);

    router.use(authenticate);

    /**
     * @swagger
     * /leads/list:
     *   post:
     *     tags: [Leads]
     *     summary: Get paginated leads
     *     description: Retrieves a paginated list of leads for the authenticated tenant.
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
     *                 example: 1
     *               limit:
     *                 type: integer
     *                 example: 10
     *               search:
     *                 type: string
     *               status:
     *                 type: string
     *                 enum: [active, deleted, all]
     *                 example: active
     *     responses:
     *       200:
     *         description: Leads fetched successfully
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
     *                     $ref: '#/components/schemas/LeadSafe'
     *                 meta:
     *                   type: object
     *                   properties:
     *                     total:
     *                       type: integer
     *                     page:
     *                       type: integer
     *                     limit:
     *                       type: integer
     *                     totalPages:
     *                       type: integer
     *       401:
     *         description: Unauthorized
     */
    router.post(
        "/list",
        validateLeadRequest(paginationSchema),
        controller.getLeadsPaginated,
    );

    /**
     * @swagger
     * /leads/all:
     *   get:
     *     tags: [Leads]
     *     summary: Get all leads
     *     description: Retrieves an unpaginated list of all leads for the authenticated tenant.
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
     *         description: Leads fetched successfully
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
     *                     $ref: '#/components/schemas/LeadSafe'
     *       401:
     *         description: Unauthorized
     */
    router.get(
        "/all",
        controller.getAllLeads,
    );

    /**
     * @swagger
     * /leads/{uid}:
     *   get:
     *     tags: [Leads]
     *     summary: Get a lead by UID
     *     description: Retrieves details of a specific lead by its UID.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: uid
     *         required: true
     *         schema:
     *           type: string
     *         description: The UID of the lead
     *     responses:
     *       200:
     *         description: Lead fetched successfully
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
     *                   $ref: '#/components/schemas/LeadSafe'
     *       404:
     *         description: Lead not found
     *       401:
     *         description: Unauthorized
     */
    router.get(
        "/:uid",
        validateLeadRequest(getByUidSchema),
        controller.getLeadByUid,
    );

    /**
     * @swagger
     * /leads:
     *   post:
     *     tags: [Leads]
     *     summary: Create a new lead
     *     description: Creates a new lead in the system.
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - firstName
     *               - mobileNumber
     *               - state
     *               - city
     *               - leadSourceUid
     *             properties:
     *               firstName:
     *                 type: string
     *               lastName:
     *                 type: string
     *               mobileNumber:
     *                 type: string
     *               alternateNumber:
     *                 type: string
     *               email:
     *                 type: string
     *               address:
     *                 type: string
     *               state:
     *                 type: string
     *               city:
     *                 type: string
     *               pinCode:
     *                 type: string
     *               monthlyBillAmount:
     *                 type: number
     *               systemSize:
     *                 type: number
     *               followUpDate:
     *                 type: string
     *                 format: date-time
     *                 example: "2026-07-07T12:00:00Z"
     *               leadSourceUid:
     *                 type: string
     *               assignedTo:
     *                 type: string
     *               remarks:
     *                 type: string
     *     responses:
     *       201:
     *         description: Lead created successfully
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
     *                   $ref: '#/components/schemas/LeadSafe'
     *       400:
     *         description: Validation error
     *       401:
     *         description: Unauthorized
     */
    router.post(
        "/",
        validateLeadRequest(createLeadSchema),
        controller.createLead,
    );

    /**
     * @swagger
     * /leads/{uid}:
     *   put:
     *     tags: [Leads]
     *     summary: Update an existing lead
     *     description: Updates the details of an existing lead.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: uid
     *         required: true
     *         schema:
     *           type: string
     *         description: The UID of the lead
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               firstName:
     *                 type: string
     *               lastName:
     *                 type: string
     *               mobileNumber:
     *                 type: string
     *               alternateNumber:
     *                 type: string
     *               email:
     *                 type: string
     *               address:
     *                 type: string
     *               state:
     *                 type: string
     *               city:
     *                 type: string
     *               pinCode:
     *                 type: string
     *               monthlyBillAmount:
     *                 type: number
     *               systemSize:
     *                 type: number
     *               followUpDate:
     *                 type: string
     *                 format: date-time
     *                 example: "2026-07-07T12:00:00Z"
     *               leadSourceUid:
     *                 type: string
     *               statusUid:
     *                 type: string
     *               assignedTo:
     *                 type: string
     *               remarks:
     *                 type: string
     *     responses:
     *       200:
     *         description: Lead updated successfully
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
     *                   $ref: '#/components/schemas/LeadSafe'
     *       400:
     *         description: Validation error
     *       404:
     *         description: Lead not found
     *       401:
     *         description: Unauthorized
     */
    router.put(
        "/:uid",
        validateLeadRequest(updateLeadSchema),
        controller.updateLead,
    );

    /**
     * @swagger
     * /leads/{uid}/status:
     *   put:
     *     tags: [Leads]
     *     summary: Change the status of a lead
     *     description: Updates only the status of an existing lead.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: uid
     *         required: true
     *         schema:
     *           type: string
     *         description: The UID of the lead
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               statusUid:
     *                 type: string
     *                 description: The UID of the new lead status
     *     responses:
     *       200:
     *         description: Lead status updated successfully
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
     *                   $ref: '#/components/schemas/LeadSafe'
     *       400:
     *         description: Validation error
     *       404:
     *         description: Lead not found
     *       401:
     *         description: Unauthorized
     */
    router.put(
        "/:uid/status",
        validateLeadRequest(changeLeadStatusSchema),
        controller.changeStatus,
    );

    /**
     * @swagger
     * /leads/{uid}:
     *   delete:
     *     tags: [Leads]
     *     summary: Delete a lead
     *     description: Soft deletes a lead by its UID.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: uid
     *         required: true
     *         schema:
     *           type: string
     *         description: The UID of the lead
     *     responses:
     *       200:
     *         description: Lead deleted successfully
     *       404:
     *         description: Lead not found
     *       401:
     *         description: Unauthorized
     */
    router.delete(
        "/:uid",
        validateLeadRequest(getByUidSchema),
        controller.deleteLead,
    );

    /**
     * @swagger
     * /leads/{uid}/restore:
     *   put:
     *     tags: [Leads]
     *     summary: Restore a deleted lead
     *     description: Restores a soft-deleted lead by its UID.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: uid
     *         required: true
     *         schema:
     *           type: string
     *         description: The UID of the lead
     *     responses:
     *       200:
     *         description: Lead restored successfully
     *       404:
     *         description: Lead not found
     *       401:
     *         description: Unauthorized
     */
    router.put(
        "/:uid/restore",
        validateLeadRequest(getByUidSchema),
        controller.restoreLead,
    );

    return router;
}

export const leadRoutes = createLeadRouter();

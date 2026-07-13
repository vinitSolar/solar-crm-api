// Cache bust
import { Router } from "express";
import { authenticate } from "../../auth/middleware/auth.middleware.js";
import { validateRequest, createQuotationScopeOfWorkSchema, updateQuotationScopeOfWorkSchema, getQuotationScopeOfWorkParamsSchema, listQuotationScopeOfWorkSchema } from "../validators/quotation-scope-of-work.validator.js";
import { createQuotationScopeOfWork, updateQuotationScopeOfWork, getQuotationScopeOfWork, listQuotationScopeOfWork, getAllQuotationScopeOfWorks, getQuotationScopeOfWorkDropdown, deleteQuotationScopeOfWork, restoreQuotationScopeOfWork } from "../controllers/quotation-scope-of-work.controller.js";

const router = Router();

// Apply authentication to all routes in this module
router.use(authenticate);

/**
 * @swagger
 * /quotation-scope-of-work/dropdown:
 *   get:
 *     tags:
 *       - Quotation Scope of Work
 *     summary: Get Scope of Work for dropdown
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully fetched dropdown
 */
router.get("/dropdown", getQuotationScopeOfWorkDropdown);

/**
 * @swagger
 * /quotation-scope-of-work/all:
 *   get:
 *     tags:
 *       - Quotation Scope of Work
 *     summary: Get all active records (dropdown fallback if needed)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully fetched all records
 */
router.get("/all", getAllQuotationScopeOfWorks);

/**
 * @swagger
 * /quotation-scope-of-work/list:
 *   post:
 *     tags:
 *       - Quotation Scope of Work
 *     summary: List Scope of Work with pagination and filters
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
 *               sortBy:
 *                 type: string
 *                 enum: [sort_order, created_at]
 *                 default: sort_order
 *               sortDir:
 *                 type: string
 *                 enum: [asc, desc]
 *                 default: asc
 *     responses:
 *       200:
 *         description: Successfully fetched list
 */
router.post("/list", validateRequest(listQuotationScopeOfWorkSchema), listQuotationScopeOfWork);

/**
 * @swagger
 * /quotation-scope-of-work:
 *   post:
 *     tags:
 *       - Quotation Scope of Work
 *     summary: Create Scope of Work
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - value
 *             properties:
 *               title:
 *                 type: string
 *               value:
 *                 type: string
 *               sortOrder:
 *                 type: integer
 *               isDefault:
 *                 type: integer
 *                 enum: [0, 1]
 *     responses:
 *       201:
 *         description: Successfully created record
 *       400:
 *         description: Validation error or duplicate title
 */
router.post("/", validateRequest(createQuotationScopeOfWorkSchema), createQuotationScopeOfWork);

/**
 * @swagger
 * /quotation-scope-of-work/{uid}:
 *   get:
 *     tags:
 *       - Quotation Scope of Work
 *     summary: Get Scope of Work by UID
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
 *         description: Successfully retrieved record
 *       404:
 *         description: Record not found
 */
router.get("/:uid", validateRequest(getQuotationScopeOfWorkParamsSchema), getQuotationScopeOfWork);

/**
 * @swagger
 * /quotation-scope-of-work/{uid}:
 *   put:
 *     tags:
 *       - Quotation Scope of Work
 *     summary: Update Scope of Work
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
 *               title:
 *                 type: string
 *               value:
 *                 type: string
 *               sortOrder:
 *                 type: integer
 *               isActive:
 *                 type: integer
 *                 enum: [0, 1]
 *     responses:
 *       200:
 *         description: Successfully updated record
 *       400:
 *         description: Validation error or duplicate title
 *       404:
 *         description: Record not found
 */
router.put("/:uid", validateRequest(updateQuotationScopeOfWorkSchema), updateQuotationScopeOfWork);

/**
 * @swagger
 * /quotation-scope-of-work/{uid}:
 *   delete:
 *     tags:
 *       - Quotation Scope of Work
 *     summary: Soft delete Scope of Work
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
 *         description: Successfully deleted record
 *       400:
 *         description: Cannot delete default record
 *       404:
 *         description: Record not found
 */
router.delete("/:uid", validateRequest(getQuotationScopeOfWorkParamsSchema), deleteQuotationScopeOfWork);

/**
 * @swagger
 * /quotation-scope-of-work/{uid}/restore:
 *   put:
 *     tags:
 *       - Quotation Scope of Work
 *     summary: Restore deleted Scope of Work
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
 *         description: Successfully restored record
 *       404:
 *         description: Record not found
 */
router.put("/:uid/restore", validateRequest(getQuotationScopeOfWorkParamsSchema), restoreQuotationScopeOfWork);

export { router as quotationScopeOfWorkRoutes };

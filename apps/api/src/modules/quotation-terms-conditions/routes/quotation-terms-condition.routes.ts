import { Router } from "express";
import { authenticate } from "../../auth/middleware/auth.middleware.js";
import {
    createQuotationTermsConditionSchema,
    updateQuotationTermsConditionSchema,
    getQuotationTermsConditionParamsSchema,
    listQuotationTermsConditionSchema,
    validateRequest
} from "../validators/quotation-terms-condition.validator.js";
import {
    createQuotationTermsCondition,
    updateQuotationTermsCondition,
    getQuotationTermsCondition,
    listQuotationTermsCondition,
    getAllQuotationTermsConditions,
    getQuotationTermsConditionDropdown,
    deleteQuotationTermsCondition
} from "../controllers/quotation-terms-condition.controller.js";
import { requirePermission } from "../../../middlewares/permission.middleware.js";

const router = Router();

// Apply auth middleware to all routes
router.use(authenticate);

/**
 * @swagger
 * /quotation-terms-conditions/all:
 *   get:
 *     tags:
 *       - Quotation Terms & Conditions
 *     summary: Get all active Terms & Conditions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully fetched all records
 */
router.get(
    "/all",
    requirePermission("QUOTATION_TERMS", "can_view"),
    getAllQuotationTermsConditions
);

/**
 * @swagger
 * /quotation-terms-conditions/dropdown:
 *   get:
 *     tags:
 *       - Quotation Terms & Conditions
 *     summary: Get Terms & Conditions for dropdown
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully fetched dropdown
 */
router.get(
    "/dropdown",
    requirePermission("QUOTATION_TERMS", "can_view"),
    getQuotationTermsConditionDropdown
);

/**
 * @swagger
 * /quotation-terms-conditions/list:
 *   post:
 *     tags:
 *       - Quotation Terms & Conditions
 *     summary: List Terms & Conditions
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
     *             $ref: '#/components/schemas/listQuotationTermsConditionSchemaBody'
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
router.post(
    "/list",
    requirePermission("QUOTATION_TERMS", "can_view"),
    validateRequest(listQuotationTermsConditionSchema),
    listQuotationTermsCondition
);

/**
 * @swagger
 * /quotation-terms-conditions/{uid}:
 *   get:
 *     tags:
 *       - Quotation Terms & Conditions
 *     summary: Get Terms & Conditions by UID
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
router.get(
    "/:uid",
    requirePermission("QUOTATION_TERMS", "can_view"),
    validateRequest(getQuotationTermsConditionParamsSchema),
    getQuotationTermsCondition
);

/**
 * @swagger
 * /quotation-terms-conditions:
 *   post:
 *     tags:
 *       - Quotation Terms & Conditions
 *     summary: Create Terms & Conditions
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
     *             $ref: '#/components/schemas/createQuotationTermsConditionSchemaBody'
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *               description:
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
router.post(
    "/",
    requirePermission("QUOTATION_TERMS", "can_create"),
    validateRequest(createQuotationTermsConditionSchema),
    createQuotationTermsCondition
);

/**
 * @swagger
 * /quotation-terms-conditions/{uid}:
 *   put:
 *     tags:
 *       - Quotation Terms & Conditions
 *     summary: Update Terms & Conditions
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
     *             $ref: '#/components/schemas/updateQuotationTermsConditionSchemaBody'
 *             properties:
 *               title:
 *                 type: string
 *               description:
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
router.put(
    "/:uid",
    requirePermission("QUOTATION_TERMS", "can_edit"),
    validateRequest(updateQuotationTermsConditionSchema),
    updateQuotationTermsCondition
);

/**
 * @swagger
 * /quotation-terms-conditions/{uid}:
 *   delete:
 *     tags:
 *       - Quotation Terms & Conditions
 *     summary: Soft delete Terms & Conditions
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
router.delete(
    "/:uid",
    requirePermission("QUOTATION_TERMS", "can_delete"),
    validateRequest(getQuotationTermsConditionParamsSchema),
    deleteQuotationTermsCondition
);

export default router;

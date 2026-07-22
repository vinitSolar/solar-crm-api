import { Router } from "express";
import { StateSubsidyRuleController } from "../controllers/state-subsidy-rule.controller.js";
import { StateSubsidyRuleService } from "../services/state-subsidy-rule.service.js";
import { StateSubsidyRuleRepository } from "../repositories/state-subsidy-rule.repository.js";
import { SubsidyRequiredDocumentRepository } from "../repositories/subsidy-required-document.repository.js";
import { SubsidyDocumentTypeRepository } from "../../subsidy-document-types/repositories/subsidy-document-type.repository.js";
import { AuditLogRepository } from "../../audit-logs/repositories/audit-logs.repository.js";
import { AuditLogService } from "../../audit-logs/services/audit-logs.service.js";
import { authenticate } from "../../auth/middleware/auth.middleware.js";
import {
    createStateSubsidyRuleSchema,
    updateStateSubsidyRuleSchema,
    paginationSchema,
    validateStateSubsidyRuleRequest
} from "../validators/state-subsidy-rule.validator.js";
import pool from "@packages/connection.js";

const router = Router();

const repository = new StateSubsidyRuleRepository(pool);
const requiredDocRepository = new SubsidyRequiredDocumentRepository(pool);
const docTypeRepository = new SubsidyDocumentTypeRepository(pool);
const auditLogRepository = new AuditLogRepository(pool);
const auditLogService = new AuditLogService(auditLogRepository);
const service = new StateSubsidyRuleService(repository, requiredDocRepository, docTypeRepository, auditLogService);
const controller = new StateSubsidyRuleController(service);

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: StateSubsidyRules
 *   description: State Subsidy Rule Management APIs
 */

/**
 * @swagger
 * /state-subsidy-rules/list:
 *   post:
 *     tags: [StateSubsidyRules]
 *     summary: Get paginated state subsidy rules
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
 *         description: State subsidy rules fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/StateSubsidyRuleSafe'
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
 */
router.post("/list", validateStateSubsidyRuleRequest(paginationSchema), controller.getPaginatedRules);

/**
 * @swagger
 * /state-subsidy-rules/all:
 *   get:
 *     tags: [StateSubsidyRules]
 *     summary: Get all state subsidy rules for dropdowns
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: State subsidy rules fetched successfully
 */
router.get("/all", controller.getDropdownRules);

/**
 * @swagger
 * /state-subsidy-rules/dropdown:
 *   get:
 *     tags: [StateSubsidyRules]
 *     summary: Get all state subsidy rules for dropdowns (Alias for /all)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: State subsidy rules fetched successfully
 */
router.get("/dropdown", controller.getDropdownRules);

/**
 * @swagger
 * /state-subsidy-rules/by-state-uid/{stateUid}:
 *   get:
 *     tags: [StateSubsidyRules]
 *     summary: Get state subsidy rules by state UID (includes 'All States' rules)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: stateUid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: State subsidy rules fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/StateSubsidyRuleSafe'
 */
router.get("/by-state-uid/:stateUid", controller.getRulesByStateUid);

/**
 * @swagger
 * /state-subsidy-rules/{uid}:
 *   get:
 *     tags: [StateSubsidyRules]
 *     summary: Get state subsidy rule by UID (includes required documents list)
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
 *         description: State subsidy rule fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/StateSubsidyRuleSafe'
 */
router.get("/:uid", controller.getRuleByUid);

/**
 * @swagger
 * /state-subsidy-rules:
 *   post:
 *     tags: [StateSubsidyRules]
 *     summary: Create a new state subsidy rule with required document mappings
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - stateUid
 *               - subsidyPerKw
 *               - maximumSubsidyAmount
 *             properties:
 *               schemeName:
 *                 type: string
 *                 example: "Surya Gujarat Scheme"
 *               stateUid:
 *                 type: string
 *                 example: "GJ"
 *               subsidyPerKw:
 *                 type: number
 *                 example: 30000
 *               maximumSubsidyAmount:
 *                 type: number
 *                 example: 78000
 *               description:
 *                 type: string
 *                 example: "Surya Gujarat Residential Solar Subsidy"
 *               documentTypeUids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["DOC_TYPE_UID_1", "DOC_TYPE_UID_2"]
 *     responses:
 *       201:
 *         description: State subsidy rule created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/StateSubsidyRuleSafe'
 */
router.post("/", validateStateSubsidyRuleRequest(createStateSubsidyRuleSchema), controller.createRule);

/**
 * @swagger
 * /state-subsidy-rules/{uid}:
 *   put:
 *     tags: [StateSubsidyRules]
 *     summary: Update an existing state subsidy rule and its required document mappings
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
 *               schemeName:
 *                 type: string
 *               stateUid:
 *                 type: string
 *               subsidyPerKw:
 *                 type: number
 *               maximumSubsidyAmount:
 *                 type: number
 *               description:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               documentTypeUids:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: State subsidy rule updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/StateSubsidyRuleSafe'
 */
router.put("/:uid", validateStateSubsidyRuleRequest(updateStateSubsidyRuleSchema), controller.updateRule);

/**
 * @swagger
 * /state-subsidy-rules/{uid}:
 *   delete:
 *     tags: [StateSubsidyRules]
 *     summary: Soft delete a state subsidy rule
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
 *         description: State subsidy rule deleted successfully
 */
router.delete("/:uid", controller.deleteRule);

/**
 * @swagger
 * /state-subsidy-rules/{uid}/restore:
 *   put:
 *     tags: [StateSubsidyRules]
 *     summary: Restore a soft-deleted state subsidy rule
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
 *         description: State subsidy rule restored successfully
 */
router.put("/:uid/restore", controller.restoreRule);

export default router;

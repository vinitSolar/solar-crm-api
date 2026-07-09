import { Router } from "express";
import { StateSubsidyRuleController } from "../controllers/state-subsidy-rule.controller.js";
import { StateSubsidyRuleService } from "../services/state-subsidy-rule.service.js";
import { StateSubsidyRuleRepository } from "../repositories/state-subsidy-rule.repository.js";
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
const service = new StateSubsidyRuleService(repository);
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
 *               limit:
 *                 type: integer
 *               search:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, deleted, all]
 *     responses:
 *       200:
 *         description: State subsidy rules fetched successfully
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
 * /state-subsidy-rules/by-state/{state}:
 *   get:
 *     tags: [StateSubsidyRules]
 *     summary: Get state subsidy rules by state name (includes 'All States' rules)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: state
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: State subsidy rules fetched successfully
 */
router.get("/by-state/:state", controller.getRulesByState);

/**
 * @swagger
 * /state-subsidy-rules/{uid}:
 *   get:
 *     tags: [StateSubsidyRules]
 *     summary: Get state subsidy rule by UID
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
 */
router.get("/:uid", controller.getRuleByUid);

/**
 * @swagger
 * /state-subsidy-rules:
 *   post:
 *     tags: [StateSubsidyRules]
 *     summary: Create a new state subsidy rule
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               state:
 *                 type: string
 *               subsidyPerKw:
 *                 type: number
 *               maximumSubsidyAmount:
 *                 type: number
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: State subsidy rule created successfully
 */
router.post("/", validateStateSubsidyRuleRequest(createStateSubsidyRuleSchema), controller.createRule);

/**
 * @swagger
 * /state-subsidy-rules/{uid}:
 *   put:
 *     tags: [StateSubsidyRules]
 *     summary: Update an existing state subsidy rule
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
 *               state:
 *                 type: string
 *               subsidyPerKw:
 *                 type: number
 *               maximumSubsidyAmount:
 *                 type: number
 *               description:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: State subsidy rule updated successfully
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

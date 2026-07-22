import { Router } from "express";
import { SubsidyDocumentTypeController } from "../controllers/subsidy-document-type.controller.js";
import { SubsidyDocumentTypeService } from "../services/subsidy-document-type.service.js";
import { SubsidyDocumentTypeRepository } from "../repositories/subsidy-document-type.repository.js";
import { AuditLogRepository } from "../../audit-logs/repositories/audit-logs.repository.js";
import { AuditLogService } from "../../audit-logs/services/audit-logs.service.js";
import { authenticate } from "../../auth/middleware/auth.middleware.js";
import {
    createSubsidyDocumentTypeSchema,
    updateSubsidyDocumentTypeSchema,
    subsidyDocumentTypePaginationSchema,
    validateSubsidyDocumentTypeRequest,
} from "../validators/subsidy-document-type.validator.js";
import pool from "@packages/connection.js";

const router = Router();

const repository = new SubsidyDocumentTypeRepository(pool);
const auditLogRepository = new AuditLogRepository(pool);
const auditLogService = new AuditLogService(auditLogRepository);
const service = new SubsidyDocumentTypeService(repository, auditLogService);
const controller = new SubsidyDocumentTypeController(service);

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: SubsidyDocumentTypes
 *   description: Subsidy Document Type Management APIs
 */

/**
 * @swagger
 * /subsidy-document-types/list:
 *   post:
 *     tags: [SubsidyDocumentTypes]
 *     summary: Get paginated subsidy document types
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
 *         description: Subsidy document types fetched successfully
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
 *                     $ref: '#/components/schemas/SubsidyDocumentTypeSafe'
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
router.post(
    "/list",
    validateSubsidyDocumentTypeRequest(subsidyDocumentTypePaginationSchema),
    controller.getPaginatedDocumentTypes
);

/**
 * @swagger
 * /subsidy-document-types/all:
 *   get:
 *     tags: [SubsidyDocumentTypes]
 *     summary: Get all active subsidy document types for dropdowns
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subsidy document types fetched successfully
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
 *                     type: object
 *                     properties:
 *                       uid:
 *                         type: string
 *                       name:
 *                         type: string
 *                       allowMultiple:
 *                         type: boolean
 *                       isRequired:
 *                         type: boolean
 *                       sortOrder:
 *                         type: integer
 */
router.get("/all", controller.getAllDocumentTypes);

/**
 * @swagger
 * /subsidy-document-types/dropdown:
 *   get:
 *     tags: [SubsidyDocumentTypes]
 *     summary: Get all active subsidy document types for dropdowns (Alias for /all)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subsidy document types fetched successfully
 */
router.get("/dropdown", controller.getAllDocumentTypes);

/**
 * @swagger
 * /subsidy-document-types/{uid}:
 *   get:
 *     tags: [SubsidyDocumentTypes]
 *     summary: Get subsidy document type by UID
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
 *         description: Subsidy document type fetched successfully
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
 *                   $ref: '#/components/schemas/SubsidyDocumentTypeSafe'
 */
router.get("/:uid", controller.getDocumentTypeByUid);

/**
 * @swagger
 * /subsidy-document-types:
 *   post:
 *     tags: [SubsidyDocumentTypes]
 *     summary: Create a new subsidy document type
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
 *                 example: "Aadhaar Card"
 *               description:
 *                 type: string
 *                 example: "Identity proof document"
 *               allowMultiple:
 *                 type: boolean
 *                 default: false
 *               isRequired:
 *                 type: boolean
 *                 default: false
 *               sortOrder:
 *                 type: integer
 *                 default: 0
 *     responses:
 *       201:
 *         description: Subsidy document type created successfully
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
 *                   $ref: '#/components/schemas/SubsidyDocumentTypeSafe'
 */
router.post(
    "/",
    validateSubsidyDocumentTypeRequest(createSubsidyDocumentTypeSchema),
    controller.createDocumentType
);

/**
 * @swagger
 * /subsidy-document-types/{uid}:
 *   put:
 *     tags: [SubsidyDocumentTypes]
 *     summary: Update an existing subsidy document type
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               allowMultiple:
 *                 type: boolean
 *               isRequired:
 *                 type: boolean
 *               sortOrder:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Subsidy document type updated successfully
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
 *                   $ref: '#/components/schemas/SubsidyDocumentTypeSafe'
 */
router.put(
    "/:uid",
    validateSubsidyDocumentTypeRequest(updateSubsidyDocumentTypeSchema),
    controller.updateDocumentType
);

/**
 * @swagger
 * /subsidy-document-types/{uid}:
 *   delete:
 *     tags: [SubsidyDocumentTypes]
 *     summary: Soft delete a subsidy document type
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
 *         description: Subsidy document type deleted successfully
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
 *                   type: object
 *                   nullable: true
 */
router.delete("/:uid", controller.deleteDocumentType);

/**
 * @swagger
 * /subsidy-document-types/{uid}/restore:
 *   put:
 *     tags: [SubsidyDocumentTypes]
 *     summary: Restore a soft-deleted subsidy document type
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
 *         description: Subsidy document type restored successfully
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
 *                   type: object
 *                   nullable: true
 */
router.put("/:uid/restore", controller.restoreDocumentType);

export default router;

import { Router } from "express";
import { FranchiseDocumentTypeController } from "../controllers/franchise-document-type.controller.js";
import { FranchiseDocumentTypeService } from "../services/franchise-document-type.service.js";
import { FranchiseDocumentTypeRepository } from "../repositories/franchise-document-type.repository.js";
import {
    createFranchiseDocumentTypeSchema,
    updateFranchiseDocumentTypeSchema,
    getByUidSchema,
    paginationSchema,
    validateRequest,
} from "../validators/franchise-document-type.validator.js";
import { authenticate } from "../../auth/middleware/auth.middleware.js";
import pool from "@packages/connection.js";

const router = Router();

const repository = new FranchiseDocumentTypeRepository(pool);
const service = new FranchiseDocumentTypeService(repository);
const controller = new FranchiseDocumentTypeController(service);

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: FranchiseDocumentTypes
 *   description: Franchise Document Type Management APIs
 */

/**
 * @swagger
 * /franchise-document-types/list:
 *   post:
 *     tags: [FranchiseDocumentTypes]
 *     summary: Get paginated franchise document types
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
 *         description: Franchise document types fetched successfully
 */
router.post("/list", validateRequest(paginationSchema), controller.getPaginatedFranchiseDocumentTypes);

/**
 * @swagger
 * /franchise-document-types/all:
 *   get:
 *     tags: [FranchiseDocumentTypes]
 *     summary: Get all franchise document types
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, deleted, all]
 *     responses:
 *       200:
 *         description: Franchise document types fetched successfully
 */
router.get("/all", controller.getAllFranchiseDocumentTypes);

/**
 * @swagger
 * /franchise-document-types/dropdown:
 *   get:
 *     tags: [FranchiseDocumentTypes]
 *     summary: Get all active franchise document types for dropdowns
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Franchise document types fetched successfully
 */
router.get("/dropdown", controller.getDropdownTypes);

/**
 * @swagger
 * /franchise-document-types/{uid}:
 *   get:
 *     tags: [FranchiseDocumentTypes]
 *     summary: Get franchise document type by UID
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
 *         description: Franchise document type fetched successfully
 */
router.get("/:uid", validateRequest(getByUidSchema), controller.getFranchiseDocumentTypeByUid);

/**
 * @swagger
 * /franchise-document-types:
 *   post:
 *     tags: [FranchiseDocumentTypes]
 *     summary: Create a new franchise document type
 *     security:
 *       - bearerAuth: []
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
 *                 type: integer
 *               isRequired:
 *                 type: integer
 *               sortOrder:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Franchise document type created successfully
 */
router.post("/", validateRequest(createFranchiseDocumentTypeSchema), controller.createFranchiseDocumentType);

/**
 * @swagger
 * /franchise-document-types/{uid}:
 *   put:
 *     tags: [FranchiseDocumentTypes]
 *     summary: Update an existing franchise document type
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
 *                 type: integer
 *               isRequired:
 *                 type: integer
 *               sortOrder:
 *                 type: integer
 *               isActive:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Franchise document type updated successfully
 */
router.put("/:uid", validateRequest(updateFranchiseDocumentTypeSchema), controller.updateFranchiseDocumentType);

/**
 * @swagger
 * /franchise-document-types/{uid}:
 *   delete:
 *     tags: [FranchiseDocumentTypes]
 *     summary: Soft delete a franchise document type
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
 *         description: Franchise document type deleted successfully
 */
router.delete("/:uid", validateRequest(getByUidSchema), controller.deleteFranchiseDocumentType);

/**
 * @swagger
 * /franchise-document-types/{uid}/restore:
 *   put:
 *     tags: [FranchiseDocumentTypes]
 *     summary: Restore a soft-deleted franchise document type
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
 *         description: Franchise document type restored successfully
 */
router.put("/:uid/restore", validateRequest(getByUidSchema), controller.restoreFranchiseDocumentType);

export default router;
export { service as franchiseDocumentTypeService };

import { Router } from "express";
import { ProductDocumentTypeController } from "../controllers/product-document-type.controller.js";
import { ProductDocumentTypeService } from "../services/product-document-type.service.js";
import { ProductDocumentTypeRepository } from "../repositories/product-document-type.repository.js";
import { 
    createProductDocumentTypeSchema, 
    updateProductDocumentTypeSchema, 
    getByUidSchema, 
    paginationSchema, 
    validateRequest 
} from "../validators/product-document-type.validator.js";
import { authenticate } from "../../auth/middleware/auth.middleware.js";
import pool from "@packages/connection.js";

const router = Router();

const repository = new ProductDocumentTypeRepository(pool);
const service = new ProductDocumentTypeService(repository);
const controller = new ProductDocumentTypeController(service);

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: ProductDocumentTypes
 *   description: Product Document Type Management APIs
 */

/**
 * @swagger
 * /product-document-types/list:
 *   post:
 *     tags: [ProductDocumentTypes]
 *     summary: Get paginated product document types
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
 *         description: Product document types fetched successfully
 */
router.post("/list", validateRequest(paginationSchema), controller.getPaginatedProductDocumentTypes);

/**
 * @swagger
 * /product-document-types/all:
 *   get:
 *     tags: [ProductDocumentTypes]
 *     summary: Get all product document types
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
 *         description: Product document types fetched successfully
 */
router.get("/all", controller.getAllProductDocumentTypes);

/**
 * @swagger
 * /product-document-types/dropdown:
 *   get:
 *     tags: [ProductDocumentTypes]
 *     summary: Get all active product document types for dropdowns
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Product document types fetched successfully
 */
router.get("/dropdown", controller.getDropdownTypes);

/**
 * @swagger
 * /product-document-types/{uid}:
 *   get:
 *     tags: [ProductDocumentTypes]
 *     summary: Get product document type by UID
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
 *         description: Product document type fetched successfully
 */
router.get("/:uid", validateRequest(getByUidSchema), controller.getProductDocumentTypeByUid);

/**
 * @swagger
 * /product-document-types:
 *   post:
 *     tags: [ProductDocumentTypes]
 *     summary: Create a new product document type
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
 *               allowedExtensions:
 *                 type: string
 *               allowMultiple:
 *                 type: integer
 *               isRequired:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Product document type created successfully
 */
router.post("/", validateRequest(createProductDocumentTypeSchema), controller.createProductDocumentType);

/**
 * @swagger
 * /product-document-types/{uid}:
 *   put:
 *     tags: [ProductDocumentTypes]
 *     summary: Update an existing product document type
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
 *               allowedExtensions:
 *                 type: string
 *               allowMultiple:
 *                 type: integer
 *               isRequired:
 *                 type: integer
 *               isActive:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Product document type updated successfully
 */
router.put("/:uid", validateRequest(updateProductDocumentTypeSchema), controller.updateProductDocumentType);

/**
 * @swagger
 * /product-document-types/{uid}:
 *   delete:
 *     tags: [ProductDocumentTypes]
 *     summary: Soft delete a product document type
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
 *         description: Product document type deleted successfully
 */
router.delete("/:uid", validateRequest(getByUidSchema), controller.deleteProductDocumentType);

/**
 * @swagger
 * /product-document-types/{uid}/restore:
 *   put:
 *     tags: [ProductDocumentTypes]
 *     summary: Restore a soft-deleted product document type
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
 *         description: Product document type restored successfully
 */
router.put("/:uid/restore", validateRequest(getByUidSchema), controller.restoreProductDocumentType);

export default router;
export { service as productDocumentTypeService };

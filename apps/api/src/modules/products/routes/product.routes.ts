import { Router } from "express";
import { ProductController } from "../controllers/product.controller.js";
import { ProductService } from "../services/product.service.js";
import { ProductRepository } from "../repositories/product.repository.js";
import { authenticate } from "../../auth/middleware/auth.middleware.js";
import { createProductSchema, updateProductSchema, paginationSchema, validateProductRequest } from "../validators/product.validator.js";
import pool from "@packages/connection.js";

const router = Router();

const repository = new ProductRepository(pool);
const service = new ProductService(repository);
const controller = new ProductController(service);

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product Management APIs
 */

/**
 * @swagger
 * /products/list:
 *   post:
 *     tags: [Products]
 *     summary: Get paginated products
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
 *         description: Products fetched successfully
 */
router.post("/list", validateProductRequest(paginationSchema), controller.getPaginatedProducts);

/**
 * @swagger
 * /products/all:
 *   get:
 *     tags: [Products]
 *     summary: Get all products for dropdowns
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
 *         description: Products fetched successfully
 */
router.get("/all", controller.getDropdownProducts);

/**
 * @swagger
 * /products/{uid}:
 *   get:
 *     tags: [Products]
 *     summary: Get product by UID
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
 *         description: Product fetched successfully
 */
router.get("/:uid", controller.getProductByUid);

/**
 * @swagger
 * /products:
 *   post:
 *     tags: [Products]
 *     summary: Create a new product
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categoryUid:
 *                 type: string
 *                 format: uuid
 *               brandUid:
 *                 type: string
 *                 format: uuid
 *               unitUid:
 *                 type: string
 *                 format: uuid
 *               name:
 *                 type: string
 *               productCode:
 *                 type: string
 *               pricePerUnit:
 *                 type: number
 *               gstPercentage:
 *                 type: number
 *               capacity:
 *                 type: string
 *               capacityUnit:
 *                 type: string
 *               warranty:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Product created successfully
 */
router.post("/", validateProductRequest(createProductSchema), controller.createProduct);

/**
 * @swagger
 * /products/{uid}:
 *   put:
 *     tags: [Products]
 *     summary: Update an existing product
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
 *               categoryUid:
 *                 type: string
 *                 format: uuid
 *               brandUid:
 *                 type: string
 *                 format: uuid
 *               unitUid:
 *                 type: string
 *                 format: uuid
 *               name:
 *                 type: string
 *               productCode:
 *                 type: string
 *               pricePerUnit:
 *                 type: number
 *               gstPercentage:
 *                 type: number
 *               capacity:
 *                 type: string
 *               capacityUnit:
 *                 type: string
 *               warranty:
 *                 type: string
 *               description:
 *                 type: string
 *               isActive:
 *                 type: integer
 *                 enum: [0, 1]
 *     responses:
 *       200:
 *         description: Product updated successfully
 */
router.put("/:uid", validateProductRequest(updateProductSchema), controller.updateProduct);

/**
 * @swagger
 * /products/{uid}:
 *   delete:
 *     tags: [Products]
 *     summary: Soft delete a product
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
 *         description: Product deleted successfully
 */
router.delete("/:uid", controller.deleteProduct);

/**
 * @swagger
 * /products/{uid}/restore:
 *   put:
 *     tags: [Products]
 *     summary: Restore a soft-deleted product
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
 *         description: Product restored successfully
 */
router.put("/:uid/restore", controller.restoreProduct);

export default router;

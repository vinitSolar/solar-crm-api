import { Router } from "express";
import multer from "multer";
import { ProductCategoryController } from "../controllers/product-category.controller.js";
import { ProductCategoryService } from "../services/product-category.service.js";
import { ProductCategoryRepository } from "../repositories/product-category.repository.js";
import { authenticate } from "../../auth/middleware/auth.middleware.js";
import { createProductCategorySchema, updateProductCategorySchema, paginationSchema, validateProductCategoryRequest } from "../validators/product-category.validator.js";
import pool from "@packages/connection.js";

const router = Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

const repository = new ProductCategoryRepository(pool);
const service = new ProductCategoryService(repository);
const controller = new ProductCategoryController(service);

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: ProductCategories
 *   description: Product Category Management APIs
 */

/**
 * @swagger
 * /product-categories/list:
 *   post:
 *     tags: [ProductCategories]
 *     summary: Get paginated product categories
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
 *         description: Product categories fetched successfully
 */
router.post("/list", validateProductCategoryRequest(paginationSchema), controller.getPaginatedCategories);

/**
 * @swagger
 * /product-categories/all:
 *   get:
 *     tags: [ProductCategories]
 *     summary: Get all product categories for dropdowns
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
 *         description: Product categories fetched successfully
 */
router.get("/all", controller.getDropdownCategories);

/**
 * @swagger
 * /product-categories/{uid}:
 *   get:
 *     tags: [ProductCategories]
 *     summary: Get product category by UID
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
 *         description: Product category fetched successfully
 */
router.get("/:uid", controller.getCategoryByUid);

/**
 * @swagger
 * /product-categories:
 *   post:
 *     tags: [ProductCategories]
 *     summary: Create a new product category
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *               sortOrder:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Product category created successfully
 */
router.post("/", upload.single("image"), validateProductCategoryRequest(createProductCategorySchema), controller.createCategory);

/**
 * @swagger
 * /product-categories/{uid}:
 *   put:
 *     tags: [ProductCategories]
 *     summary: Update an existing product category
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *               sortOrder:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *                 description: Provide as string "true" or "false" if multipart
 *     responses:
 *       200:
 *         description: Product category updated successfully
 */
router.put("/:uid", upload.single("image"), validateProductCategoryRequest(updateProductCategorySchema), controller.updateCategory);

/**
 * @swagger
 * /product-categories/{uid}:
 *   delete:
 *     tags: [ProductCategories]
 *     summary: Soft delete a product category
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
 *         description: Product category deleted successfully
 */
router.delete("/:uid", controller.deleteCategory);

/**
 * @swagger
 * /product-categories/{uid}/restore:
 *   put:
 *     tags: [ProductCategories]
 *     summary: Restore a soft-deleted product category
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
 *         description: Product category restored successfully
 */
router.put("/:uid/restore", controller.restoreCategory);

export default router;

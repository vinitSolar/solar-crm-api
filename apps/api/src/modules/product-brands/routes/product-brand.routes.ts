import { Router } from "express";
import multer from "multer";
import { ProductBrandController } from "../controllers/product-brand.controller.js";
import { ProductBrandService } from "../services/product-brand.service.js";
import { ProductBrandRepository } from "../repositories/product-brand.repository.js";
import { authenticate } from "../../auth/middleware/auth.middleware.js";
import { createProductBrandSchema, updateProductBrandSchema, paginationSchema, validateProductBrandRequest } from "../validators/product-brand.validator.js";
import pool from "@packages/connection.js";

const router = Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

const repository = new ProductBrandRepository(pool);
const service = new ProductBrandService(repository);
const controller = new ProductBrandController(service);

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: ProductBrands
 *   description: Product Brand Management APIs
 */

/**
 * @swagger
 * /product-brands/list:
 *   post:
 *     tags: [ProductBrands]
 *     summary: Get paginated product brands
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
 *         description: Product brands fetched successfully
 */
router.post("/list", validateProductBrandRequest(paginationSchema), controller.getPaginatedBrands);

/**
 * @swagger
 * /product-brands/all:
 *   get:
 *     tags: [ProductBrands]
 *     summary: Get all product brands for dropdowns
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
 *         description: Product brands fetched successfully
 */
router.get("/all", controller.getDropdownBrands);

/**
 * @swagger
 * /product-brands/{uid}:
 *   get:
 *     tags: [ProductBrands]
 *     summary: Get product brand by UID
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
 *         description: Product brand fetched successfully
 */
router.get("/:uid", controller.getBrandByUid);

/**
 * @swagger
 * /product-brands:
 *   post:
 *     tags: [ProductBrands]
 *     summary: Create a new product brand
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
 *               logo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Product brand created successfully
 */
router.post("/", upload.single("logo"), validateProductBrandRequest(createProductBrandSchema), controller.createBrand);

/**
 * @swagger
 * /product-brands/{uid}:
 *   put:
 *     tags: [ProductBrands]
 *     summary: Update an existing product brand
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
 *               logo:
 *                 type: string
 *                 format: binary
 *               isActive:
 *                 type: boolean
 *                 description: Provide as string "true" or "false" if multipart
 *     responses:
 *       200:
 *         description: Product brand updated successfully
 */
router.put("/:uid", upload.single("logo"), validateProductBrandRequest(updateProductBrandSchema), controller.updateBrand);

/**
 * @swagger
 * /product-brands/{uid}:
 *   delete:
 *     tags: [ProductBrands]
 *     summary: Soft delete a product brand
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
 *         description: Product brand deleted successfully
 */
router.delete("/:uid", controller.deleteBrand);

/**
 * @swagger
 * /product-brands/{uid}/restore:
 *   put:
 *     tags: [ProductBrands]
 *     summary: Restore a soft-deleted product brand
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
 *         description: Product brand restored successfully
 */
router.put("/:uid/restore", controller.restoreBrand);

export default router;

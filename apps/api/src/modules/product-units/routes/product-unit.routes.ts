import { Router } from "express";
import { ProductUnitController } from "../controllers/product-unit.controller.js";
import { ProductUnitService } from "../services/product-unit.service.js";
import { ProductUnitRepository } from "../repositories/product-unit.repository.js";
import { authenticate } from "../../auth/middleware/auth.middleware.js";
import { createProductUnitSchema, updateProductUnitSchema, paginationSchema, validateProductUnitRequest } from "../validators/product-unit.validator.js";
import pool from "@packages/connection.js";

const router = Router();

const repository = new ProductUnitRepository(pool);
const service = new ProductUnitService(repository);
const controller = new ProductUnitController(service);

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: ProductUnits
 *   description: Product Unit Management APIs
 */

/**
 * @swagger
 * /product-units/list:
 *   post:
 *     tags: [ProductUnits]
 *     summary: Get paginated product units
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
 *         description: Product units fetched successfully
 */
router.post("/list", validateProductUnitRequest(paginationSchema), controller.getPaginatedUnits);

/**
 * @swagger
 * /product-units/all:
 *   get:
 *     tags: [ProductUnits]
 *     summary: Get all product units for dropdowns
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
 *         description: Product units fetched successfully
 */
router.get("/all", controller.getDropdownUnits);

/**
 * @swagger
 * /product-units/{uid}:
 *   get:
 *     tags: [ProductUnits]
 *     summary: Get product unit by UID
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
 *         description: Product unit fetched successfully
 */
router.get("/:uid", controller.getUnitByUid);

/**
 * @swagger
 * /product-units:
 *   post:
 *     tags: [ProductUnits]
 *     summary: Create a new product unit
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
 *               shortName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Product unit created successfully
 */
router.post("/", validateProductUnitRequest(createProductUnitSchema), controller.createUnit);

/**
 * @swagger
 * /product-units/{uid}:
 *   put:
 *     tags: [ProductUnits]
 *     summary: Update an existing product unit
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
 *               shortName:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Product unit updated successfully
 */
router.put("/:uid", validateProductUnitRequest(updateProductUnitSchema), controller.updateUnit);

/**
 * @swagger
 * /product-units/{uid}:
 *   delete:
 *     tags: [ProductUnits]
 *     summary: Soft delete a product unit
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
 *         description: Product unit deleted successfully
 */
router.delete("/:uid", controller.deleteUnit);

/**
 * @swagger
 * /product-units/{uid}/restore:
 *   put:
 *     tags: [ProductUnits]
 *     summary: Restore a soft-deleted product unit
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
 *         description: Product unit restored successfully
 */
router.put("/:uid/restore", controller.restoreUnit);

export default router;

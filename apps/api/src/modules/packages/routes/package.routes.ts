import { Router } from "express";
import { PackageController } from "../controllers/package.controller.js";
import { PackageService } from "../services/package.service.js";
import { PackageRepository } from "../repositories/package.repository.js";
import { authenticate } from "../../auth/middleware/auth.middleware.js";
import { createPackageSchema, updatePackageSchema, paginationSchema, validatePackageRequest } from "../validators/package.validator.js";
import pool from "@packages/connection.js";

const router = Router();

const repository = new PackageRepository(pool);
const service = new PackageService(repository);
const controller = new PackageController(service);

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Packages
 *   description: Package Management APIs
 */

/**
 * @swagger
 * /packages/list:
 *   post:
 *     tags: [Packages]
 *     summary: Get paginated packages
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
 *               capacityKw:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [active, deleted, all]
 *                 default: active
 *     responses:
 *       200:
 *         description: Packages fetched successfully
 */
router.post("/list", validatePackageRequest(paginationSchema), controller.getPaginatedPackages);

/**
 * @swagger
 * /packages/all:
 *   get:
 *     tags: [Packages]
 *     summary: Get all packages for dropdowns
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
 *         description: Packages fetched successfully
 */
router.get("/all", controller.getDropdownPackages);

/**
 * @swagger
 * /packages/{uid}:
 *   get:
 *     tags: [Packages]
 *     summary: Get package by UID
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
 *         description: Package fetched successfully
 */
router.get("/:uid", controller.getPackageByUid);

/**
 * @swagger
 * /packages:
 *   post:
 *     tags: [Packages]
 *     summary: Create a new package
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
 *               - packageCode
 *               - price
 *               - products
 *             properties:
 *               name:
 *                 type: string
 *               packageCode:
 *                 type: string
 *               description:
 *                 type: string
 *               capacityKw:
 *                 type: number
 *               price:
 *                 type: number
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - productUid
 *                     - quantity
 *                   properties:
 *                     productUid:
 *                       type: string
 *                       format: uuid
 *                     quantity:
 *                       type: number
 *                     remarks:
 *                       type: string
 *     responses:
 *       201:
 *         description: Package created successfully
 */
router.post("/", validatePackageRequest(createPackageSchema), controller.createPackage);

/**
 * @swagger
 * /packages/{uid}:
 *   put:
 *     tags: [Packages]
 *     summary: Update an existing package
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
 *               packageCode:
 *                 type: string
 *               description:
 *                 type: string
 *               capacityKw:
 *                 type: number
 *               price:
 *                 type: number
 *               isActive:
 *                 type: integer
 *                 enum: [0, 1]
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - productUid
 *                     - quantity
 *                   properties:
 *                     productUid:
 *                       type: string
 *                       format: uuid
 *                     quantity:
 *                       type: number
 *                     remarks:
 *                       type: string
 *     responses:
 *       200:
 *         description: Package updated successfully
 */
router.put("/:uid", validatePackageRequest(updatePackageSchema), controller.updatePackage);

/**
 * @swagger
 * /packages/{uid}:
 *   delete:
 *     tags: [Packages]
 *     summary: Soft delete a package
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
 *         description: Package deleted successfully
 */
router.delete("/:uid", controller.deletePackage);

/**
 * @swagger
 * /packages/{uid}/restore:
 *   put:
 *     tags: [Packages]
 *     summary: Restore a soft-deleted package
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
 *         description: Package restored successfully
 */
router.put("/:uid/restore", controller.restorePackage);

export default router;

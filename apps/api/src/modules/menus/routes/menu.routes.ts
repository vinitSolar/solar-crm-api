import { Router } from "express";
import { MenuController } from "../controllers/menu.controller.js";
import { MenuService } from "../services/menu.service.js";
import { MenuRepository } from "../repositories/menu.repository.js";
import { authenticate } from "../../auth/middleware/auth.middleware.js";
import { createMenuSchema, updateMenuSchema, paginationSchema, validateMenuRequest } from "../validators/menu.validator.js";
import pool from "@packages/connection.js";


const router = Router();

// Dependency Injection
const menuRepository = new MenuRepository(pool);
const menuService = new MenuService(menuRepository);
const menuController = new MenuController(menuService);

// All menu routes require authentication
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Menus
 *   description: Menu management for the application
 */

/**
 * @swagger
 * /menus/list:
 *   post:
 *     tags: [Menus]
 *     summary: Get paginated menus
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
 *         description: Menus retrieved successfully
 */
router.post("/list", validateMenuRequest(paginationSchema), menuController.getMenus);

/**
 * @swagger
 * /menus/all:
 *   get:
 *     tags: [Menus]
 *     summary: Get all menus (optionally filtered by status)
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
 *         description: Menus retrieved successfully
 */
router.get("/all", menuController.getAllMenus);

/**
 * @swagger
 * /menus/{uid}:
 *   get:
 *     tags: [Menus]
 *     summary: Get a specific menu by UID
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
 *         description: Menu details
 *       404:
 *         description: Menu not found
 */
router.get("/:uid", menuController.getMenuByUid);

/**
 * @swagger
 * /menus:
 *   post:
 *     tags: [Menus]
 *     summary: Create a new menu
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
 *               code:
 *                 type: string
 *               route:
 *                 type: string
 *               icon:
 *                 type: string
 *               parentUid:
 *                 type: string
 *               sortOrder:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Menu created successfully
 */
router.post("/", validateMenuRequest(createMenuSchema), menuController.createMenu);

/**
 * @swagger
 * /menus/{uid}:
 *   put:
 *     tags: [Menus]
 *     summary: Update an existing menu
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
 *               code:
 *                 type: string
 *               route:
 *                 type: string
 *               icon:
 *                 type: string
 *               parentUid:
 *                 type: string
 *               sortOrder:
 *                 type: integer
 *               isActive:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Menu updated successfully
 */
router.put("/:uid", validateMenuRequest(updateMenuSchema), menuController.updateMenu);

/**
 * @swagger
 * /menus/{uid}:
 *   delete:
 *     tags: [Menus]
 *     summary: Soft delete a menu
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
 *         description: Menu deleted successfully
 */
router.delete("/:uid", menuController.deleteMenu);

/**
 * @swagger
 * /menus/{uid}/restore:
 *   put:
 *     tags: [Menus]
 *     summary: Restore a soft-deleted menu
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
 *         description: Menu restored successfully
 */
router.put("/:uid/restore", menuController.restoreMenu);

export default router;

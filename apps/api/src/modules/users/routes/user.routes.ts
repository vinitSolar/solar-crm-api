import { Router } from "express";
import { UserController } from "../controllers/user.controller.js";
import { UserService } from "../services/user.service.js";
import { UserRepository } from "../repositories/user.repository.js";
import { createUserSchema, updateUserSchema, getUserSchema, deleteUserSchema, validateUserRequest, getPaginatedUsersSchema, restoreUserSchema, getAllUsersSchema } from "../validators/user.validator.js";
import { authenticate } from "../../auth/middleware/auth.middleware.js";
import pool from "@packages/connection.js";

function createUserRouter(): Router {
    const router = Router();

    // Dependency injection
    const userRepository = new UserRepository(pool);
    const userService = new UserService(userRepository);
    const userController = new UserController(userService);

    /**
     * @swagger
     * /users/list:
     *   post:
     *     tags: [Users]
     *     summary: Get paginated users for the authenticated tenant
     *     description: Retrieves a paginated list of all users for the authenticated tenant.
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
     *                 example: 1
     *               limit:
     *                 type: integer
     *                 example: 10
     *               search:
     *                 type: string
     *               status:
     *                 type: string
     *                 enum: [active, deleted, all]
     *                 example: active
     *               canSiteSurvey:
     *                 type: integer
     *                 enum: [0, 1]
     *               canInstallation:
     *                 type: integer
     *                 enum: [0, 1]
     *     responses:
     *       200:
     *         description: Users fetched successfully
     *       401:
     *         description: Unauthorized
     */
    router.post(
        "/list",
        authenticate,
        validateUserRequest(getPaginatedUsersSchema),
        userController.getUsers,
    );

    /**
     * @swagger
     * /users/all:
     *   post:
     *     tags: [Users]
     *     summary: Get all users (without pagination)
     *     description: Retrieves a list of all users for the authenticated tenant, useful for dropdowns.
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: false
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               status:
     *                 type: string
     *                 enum: [active, deleted, all]
     *               canSiteSurvey:
     *                 type: integer
     *                 enum: [0, 1]
     *               canInstallation:
     *                 type: integer
     *                 enum: [0, 1]
     *     responses:
     *       200:
     *         description: Users fetched successfully
     *       401:
     *         description: Unauthorized
     */
    router.post(
        "/all",
        authenticate,
        validateUserRequest(getAllUsersSchema),
        userController.getAllUsers,
    );

    /**
     * @swagger
     * /users/{uid}:
     *   get:
     *     tags: [Users]
     *     summary: Get a specific user by UID
     *     description: Retrieves details of a specific user by its UID.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: uid
     *         required: true
     *         schema:
     *           type: string
     *         description: The user UID
     *     responses:
     *       200:
     *         description: User fetched successfully
     *       401:
     *         description: Unauthorized
     *       404:
     *         description: User not found
     */
    router.get(
        "/:uid",
        authenticate,
        validateUserRequest(getUserSchema),
        userController.getUserByUid,
    );

    /**
     * @swagger
     * /users:
     *   post:
     *     tags: [Users]
     *     summary: Create a new user
     *     description: Creates a new user for the authenticated tenant.
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [roleUid, firstName, lastName, email, password]
     *             properties:
     *               roleUid:
     *                 type: string
     *               firstName:
     *                 type: string
     *               lastName:
     *                 type: string
     *               email:
     *                 type: string
     *               password:
     *                 type: string
     *     responses:
     *       201:
     *         description: User created successfully
     *       400:
     *         description: Validation failed or email already exists
     *       401:
     *         description: Unauthorized
     */
    router.post(
        "/",
        authenticate,
        validateUserRequest(createUserSchema),
        userController.createUser,
    );

    /**
     * @swagger
     * /users/{uid}:
     *   put:
     *     tags: [Users]
     *     summary: Update an existing user
     *     description: Updates the details of an existing user.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: uid
     *         required: true
     *         schema:
     *           type: string
     *         description: The user UID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               roleUid:
     *                 type: string
     *               firstName:
     *                 type: string
     *               lastName:
     *                 type: string
     *               email:
     *                 type: string
     *               password:
     *                 type: string
     *               isActive:
     *                 type: integer
     *                 enum: [0, 1, 2]
     *     responses:
     *       200:
     *         description: User updated successfully
     *       400:
     *         description: Validation failed
     *       401:
     *         description: Unauthorized
     *       404:
     *         description: User not found
     */
    router.put(
        "/:uid",
        authenticate,
        validateUserRequest(updateUserSchema),
        userController.updateUser,
    );

    /**
     * @swagger
     * /users/{uid}:
     *   delete:
     *     tags: [Users]
     *     summary: Delete a user
     *     description: Deletes an existing user by its UID. System users cannot be deleted.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: uid
     *         required: true
     *         schema:
     *           type: string
     *         description: The user UID
     *     responses:
     *       200:
     *         description: User deleted successfully
     *       401:
     *         description: Unauthorized
     *       404:
     *         description: User not found
     */
    router.delete(
        "/:uid",
        authenticate,
        validateUserRequest(deleteUserSchema),
        userController.deleteUser,
    );

    /**
     * @swagger
     * /users/{uid}/restore:
     *   put:
     *     tags: [Users]
     *     summary: Restore a deleted user
     *     description: Restores a soft-deleted user by its UID.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: uid
     *         required: true
     *         schema:
     *           type: string
     *         description: The user UID
     *     responses:
     *       200:
     *         description: User restored successfully
     *       401:
     *         description: Unauthorized
     *       404:
     *         description: User not found or not deleted
     */
    router.put(
        "/:uid/restore",
        authenticate,
        validateUserRequest(restoreUserSchema),
        userController.restoreUser,
    );

    return router;
}

export const userRoutes = createUserRouter();

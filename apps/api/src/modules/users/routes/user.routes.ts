import { Router } from "express";
import { UserController } from "../controllers/user.controller.js";
import { UserService } from "../services/user.service.js";
import { UserRepository } from "../repositories/user.repository.js";
import { createUserSchema, updateUserSchema, getUserSchema, deleteUserSchema, validateUserRequest, getPaginatedUsersSchema, restoreUserSchema, getAllUsersSchema } from "../validators/user.validator.js";
import { registerDeviceTokenSchema, deleteDeviceTokenSchema, sendPushNotificationSchema } from "../validators/device-token.validator.js";
import { DeviceTokenRepository } from "../repositories/device-token.repository.js";
import { DeviceTokenService } from "../services/device-token.service.js";
import { DeviceTokenController } from "../controllers/device-token.controller.js";
import { authenticate } from "../../auth/middleware/auth.middleware.js";
import pool from "@packages/connection.js";
import { requirePermission } from "../../../middlewares/permission.middleware.js";

function createUserRouter(): Router {
    const router = Router();

    // Dependency injection
    const userRepository = new UserRepository(pool);
    const userService = new UserService(userRepository);
    const userController = new UserController(userService);

    const deviceTokenRepository = new DeviceTokenRepository(pool);
    const deviceTokenService = new DeviceTokenService(deviceTokenRepository, userRepository);
    const deviceTokenController = new DeviceTokenController(deviceTokenService);

    // Public push notification test routes (unauthenticated - requires target userUid)
    /**
     * @swagger
     * /users/push-notification:
     *   post:
     *     tags: [Users]
     *     summary: Send a push notification to a user
     *     description: Dispatches an FCM real-time push notification to active mobile device(s) of a specific user. Does not require authentication.
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - userUid
     *             properties:
     *               userUid:
     *                 type: string
     *                 description: Target user UID.
     *               title:
     *                 type: string
     *                 example: "Test Push"
     *               body:
     *                 type: string
     *                 example: "Hello! This is a test notification."
     *               template:
     *                 type: string
     *                 enum: [TEST_PUSH, LEAD_ASSIGNED]
     *                 default: TEST_PUSH
     *               leadNumber:
     *                 type: string
     *                 example: "SS00001"
     *               customerName:
     *                 type: string
     *                 example: "Ramesh Patel"
     *               systemSize:
     *                 type: string
     *                 example: "5 kW"
     *               city:
     *                 type: string
     *                 example: "Navi Mumbai"
     *     responses:
     *       200:
     *         description: Notification dispatch result
     *       400:
     *         description: userUid missing
     *       404:
     *         description: Target user not found
     */
    router.post(
        "/push-notification",
        validateUserRequest(sendPushNotificationSchema),
        deviceTokenController.sendPushNotification
    );

    router.post(
        "/test-push",
        validateUserRequest(sendPushNotificationSchema),
        deviceTokenController.sendPushNotification
    );

    router.post(
        "/:uid/push-notification",
        validateUserRequest(sendPushNotificationSchema),
        deviceTokenController.sendPushNotification
    );

    router.use(authenticate);

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
     *             $ref: '#/components/schemas/getPaginatedUsersSchemaBody'
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
     *               canSale:
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
        requirePermission("USERS", "can_view"),
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
     *             $ref: '#/components/schemas/getAllUsersSchemaBody'
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
     *               canSale:
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
        requirePermission("USERS", "can_create"),
        authenticate,
        validateUserRequest(getAllUsersSchema),
        userController.getAllUsers,
    );

    /**
     * @swagger
     * /users/dropdown:
     *   post:
     *     tags: [Users]
     *     summary: Get all users for dropdown
     *     description: Retrieves a list of all users for the authenticated tenant, formatted for a dropdown. Places the current user at the top as "My Self".
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: false
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/getAllUsersSchemaBody'
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
     *               canSale:
     *                 type: integer
     *                 enum: [0, 1]
     *     responses:
     *       200:
     *         description: Users fetched successfully
     *       401:
     *         description: Unauthorized
     */
    router.post(
        "/dropdown",
        requirePermission("USERS", "can_create"),
        authenticate,
        validateUserRequest(getAllUsersSchema),
        userController.getUsersForDropdown,
    );

    /**
     * @swagger
     * /users/device-token:
     *   post:
     *     tags: [Users]
     *     summary: Register or update mobile device FCM token
     *     description: Registers or updates an Android/iOS device token for push notifications.
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - deviceToken
     *               - deviceType
     *             properties:
     *               deviceToken:
     *                 type: string
     *               deviceType:
     *                 type: string
     *                 enum: [android, ios]
     *               deviceName:
     *                 type: string
     *     responses:
     *       200:
     *         description: Device token registered successfully
     *       401:
     *         description: Unauthorized
     */
    router.post(
        "/device-token",
        validateUserRequest(registerDeviceTokenSchema),
        deviceTokenController.registerToken
    );

    /**
     * @swagger
     * /users/device-token:
     *   delete:
     *     tags: [Users]
     *     summary: Explicitly unregister a mobile device FCM token
     *     description: Explicitly unregisters an Android/iOS device token (e.g. if the user opts out of push notifications). Note that this should NOT be called on normal user logout if you want notifications to continue reaching the user while the app is in background or closed.
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - deviceToken
     *             properties:
     *               deviceToken:
     *                 type: string
     *     responses:
     *       200:
     *         description: Device token deactivated successfully
     *       401:
     *         description: Unauthorized
     */
    router.delete(
        "/device-token",
        validateUserRequest(deleteDeviceTokenSchema),
        deviceTokenController.removeToken
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
        requirePermission("USERS", "can_view"),
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
     *             $ref: '#/components/schemas/createUserSchemaBody'
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
        requirePermission("USERS", "can_create"),
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
     *             $ref: '#/components/schemas/updateUserSchemaBody'
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
        requirePermission("USERS", "can_edit"),
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
        requirePermission("USERS", "can_delete"),
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
        requirePermission("USERS", "can_edit"),
        authenticate,
        validateUserRequest(restoreUserSchema),
        userController.restoreUser,
    );

    return router;
}

export const userRoutes = createUserRouter();

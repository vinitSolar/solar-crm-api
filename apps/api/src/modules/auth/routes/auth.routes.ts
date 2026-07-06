import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import { AuthService } from "../services/auth.service.js";
import { AuthRepository } from "../repositories/auth.repository.js";
import { validateRequest, loginSchema, refreshTokenSchema, logoutSchema } from "../validators/auth.validator.js";
import { authenticate } from "../middleware/auth.middleware.js";
import pool from "@packages/connection.js";

/**
 * Auth module route factory.
 *
 * Wires up the dependency chain:
 * Pool → Repository → Service → Controller → Routes
 *
 * All dependencies are created here and injected through constructors,
 * making this the composition root for the auth module.
 */
function createAuthRouter(): Router {
    const router = Router();

    // Dependency injection chain
    const authRepository = new AuthRepository(pool);
    const authService = new AuthService(authRepository);
    const authController = new AuthController(authService);

    /**
     * @swagger
     * /auth/login:
     *   post:
     *     tags: [Authentication]
     *     summary: Login with email and password
     *     description: Authenticates a user and returns JWT access and refresh tokens.
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [email, password]
     *             properties:
     *               email:
     *                 type: string
     *                 format: email
     *                 example: admin@sunselect.com
     *               password:
     *                 type: string
     *                 minLength: 6
     *                 example: Admin@123
     *     responses:
     *       200:
     *         description: Login successful
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 message:
     *                   type: string
     *                   example: Login successful
     *                 data:
     *                   type: object
     *                   properties:
     *                     user:
     *                       $ref: '#/components/schemas/UserSafe'
     *                     accessToken:
     *                       type: string
     *                     refreshToken:
     *                       type: string
     *                     expiresIn:
     *                       type: string
     *                       example: 15m
     *       400:
     *         description: Validation failed
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       401:
     *         description: Invalid credentials
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    router.post(
        "/login",
        validateRequest(loginSchema),
        authController.login,
    );

    /**
     * @swagger
     * /auth/refresh-token:
     *   post:
     *     tags: [Authentication]
     *     summary: Refresh access token
     *     description: Generates a new access and refresh token pair using a valid refresh token.
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [refreshToken]
     *             properties:
     *               refreshToken:
     *                 type: string
     *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     *     responses:
     *       200:
     *         description: Token refreshed successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 message:
     *                   type: string
     *                   example: Token refreshed successfully
     *                 data:
     *                   type: object
     *                   properties:
     *                     accessToken:
     *                       type: string
     *                     refreshToken:
     *                       type: string
     *                     expiresIn:
     *                       type: string
     *                       example: 15m
     *       400:
     *         description: Validation failed
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       401:
     *         description: Invalid or expired refresh token
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    router.post(
        "/refresh-token",
        validateRequest(refreshTokenSchema),
        authController.refreshToken,
    );

    /**
     * @swagger
     * /auth/logout:
     *   post:
     *     tags: [Authentication]
     *     summary: Logout user
     *     description: Logs out a user by invalidating their refresh token session in Redis.
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [refreshToken]
     *             properties:
     *               refreshToken:
     *                 type: string
     *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     *     responses:
     *       200:
     *         description: Logout successful
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 message:
     *                   type: string
     *                   example: Logout successful
     *                 data:
     *                   type: object
     *                   nullable: true
     *       400:
     *         description: Validation failed
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    router.post(
        "/logout",
        validateRequest(logoutSchema),
        authController.logout,
    );

    /**
     * @swagger
     * /auth/me:
     *   get:
     *     tags: [Authentication]
     *     summary: Get current user profile
     *     description: Returns the authenticated user's profile. Requires a valid access token.
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Profile fetched successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 message:
     *                   type: string
     *                   example: Profile fetched successfully
     *                 data:
     *                   type: object
     *                   properties:
     *                     user:
     *                       $ref: '#/components/schemas/UserSafe'
     *       401:
     *         description: Authentication required
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    router.get(
        "/me",
        authenticate,
        authController.me,
    );

    return router;
}

export const authRoutes = createAuthRouter();

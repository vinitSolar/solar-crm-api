import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import { AuthService } from "../services/auth.service.js";
import { AuthRepository } from "../repositories/auth.repository.js";
import { OtpRepository } from "../repositories/otp.repository.js";
import { validateRequest, loginSchema, refreshTokenSchema, logoutSchema, changePasswordSchema, forgotPasswordSchema, resetPasswordSchema } from "../validators/auth.validator.js";
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
    const otpRepository = new OtpRepository(pool);
    const authService = new AuthService(authRepository, otpRepository);
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

    /**
     * @swagger
     * /auth/permissions:
     *   get:
     *     tags: [Authentication]
     *     summary: Get user permissions
     *     description: Returns the authenticated user's menu, feature permissions and role capabilities. Requires a valid access token.
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Permissions fetched successfully
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
     *                   example: Permissions fetched successfully
     *                 data:
     *                   type: object
     *                   properties:
     *                     menus:
     *                       type: array
     *                       items:
     *                         type: object
     *                         properties:
     *                           menu_uid:
     *                             type: string
     *                           name:
     *                             type: string
     *                           code:
     *                             type: string
     *                           route:
     *                             type: string
     *                           can_view:
     *                             type: number
     *                             example: 1
     *                           can_create:
     *                             type: number
     *                             example: 1
     *                           can_edit:
     *                             type: number
     *                             example: 1
     *                           can_delete:
     *                             type: number
     *                             example: 0
     *                     features:
     *                       type: array
     *                       items:
     *                         type: object
     *                         properties:
     *                           feature_uid:
     *                             type: string
     *                           menu_uid:
     *                             type: string
     *                           name:
     *                             type: string
     *                           code:
     *                             type: string
     *                           is_enabled:
     *                             type: number
     *                             example: 1
     *                     role:
     *                       type: object
     *                       properties:
     *                         can_site_survey:
     *                           type: number
     *                           example: 1
     *                         can_installation:
     *                           type: number
     *                           example: 0
     *       401:
     *         description: Authentication required
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    router.get(
        "/permissions",
        authenticate,
        authController.permissions,
    );

    /**
     * @swagger
     * /auth/change-password:
     *   put:
     *     tags: [Authentication]
     *     summary: Change user password
     *     description: Allows an authenticated user to change their own password. Requires a valid access token.
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [oldPassword, newPassword]
     *             properties:
     *               oldPassword:
     *                 type: string
     *               newPassword:
     *                 type: string
     *                 minLength: 6
     *     responses:
     *       200:
     *         description: Password changed successfully
     *       400:
     *         description: Validation failed
     *       401:
     *         description: Old password incorrect or unauthorized
     *       404:
     *         description: User not found
     */
    router.put(
        "/change-password",
        authenticate,
        validateRequest(changePasswordSchema),
        authController.changePassword
    );

    /**
     * @swagger
     * /auth/forgot-password:
     *   post:
     *     tags: [Authentication]
     *     summary: Initiates the forgot password flow
     *     description: Generates an OTP and sends it to the user's email address if it exists.
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [email]
     *             properties:
     *               email:
     *                 type: string
     *                 format: email
     *     responses:
     *       200:
     *         description: OTP sent successfully (or simulated success)
     *       400:
     *         description: Validation failed
     */
    router.post(
        "/forgot-password",
        validateRequest(forgotPasswordSchema),
        authController.forgotPassword
    );

    /**
     * @swagger
     * /auth/reset-password:
     *   post:
     *     tags: [Authentication]
     *     summary: Resets the user's password using an OTP
     *     description: Validates the OTP and sets a new password.
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [email, otp, newPassword]
     *             properties:
     *               email:
     *                 type: string
     *                 format: email
     *               otp:
     *                 type: string
     *               newPassword:
     *                 type: string
     *                 minLength: 6
     *     responses:
     *       200:
     *         description: Password reset successfully
     *       400:
     *         description: Invalid OTP or Validation failed
     *       404:
     *         description: User not found
     */
    router.post(
        "/reset-password",
        validateRequest(resetPasswordSchema),
        authController.resetPassword
    );

    return router;
}

export const authRoutes = createAuthRouter();

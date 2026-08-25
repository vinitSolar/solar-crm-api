import type { Request, Response, NextFunction } from "express";
import type { AuthService } from "../services/auth.service.js";
import type { LoginRequestDto } from "../dto/login.dto.js";
import type { RefreshTokenRequestDto } from "../dto/refresh-token.dto.js";
import type { LogoutRequestDto } from "../dto/logout.dto.js";
import type { IAuthenticatedRequest } from "../interfaces/auth.interface.js";
import { AUTH_MESSAGES } from "../constants/auth.constants.js";
import { logger } from "@packages/logger/index.js";

/**
 * Authentication Controller.
 *
 * Thin controller that:
 * 1. Receives validated requests
 * 2. Delegates to AuthService
 * 3. Returns standardized responses
 *
 * No business logic. No SQL.
 */
export class AuthController {
    private readonly authService: AuthService;

    constructor(authService: AuthService) {
        this.authService = authService;
    }

    /**
     * POST /auth/login
     *
     * Handles user login. Request body is pre-validated by Zod middleware.
     */
    login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        // TODO: Implement login controller
        // - Extract validated DTO from req.body
        // - Call authService.login()
        // - Return standardized success response
        // - Pass errors to next() for centralized error handling
        try {
            const dto = req.body as LoginRequestDto;

            logger.info("AuthController.login", { email: dto.email });

            const result = await this.authService.login(dto);

            res.status(200).json({
                success: true,
                message: AUTH_MESSAGES.LOGIN_SUCCESS,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * POST /auth/refresh-token
     *
     * Handles token refresh. Request body is pre-validated by Zod middleware.
     */
    refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        // TODO: Implement refresh token controller
        // - Extract validated DTO from req.body
        // - Call authService.refreshToken()
        // - Return standardized success response
        // - Pass errors to next() for centralized error handling
        try {
            const dto = req.body as RefreshTokenRequestDto;

            logger.info("AuthController.refreshToken");

            const result = await this.authService.refreshToken(dto);

            res.status(200).json({
                success: true,
                message: AUTH_MESSAGES.REFRESH_SUCCESS,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * POST /auth/logout
     *
     * Handles user logout. Request body is pre-validated by Zod middleware.
     */
    logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const dto = req.body as LogoutRequestDto;

            logger.info("AuthController.logout attempt");

            await this.authService.logout(dto.refreshToken);

            res.status(200).json({
                success: true,
                message: AUTH_MESSAGES.LOGOUT_SUCCESS,
                data: null,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * GET /auth/me
     *
     * Returns the authenticated user's profile.
     * Requires the `authenticate` middleware to run first.
     */
    me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        // TODO: Implement me controller
        // - Extract user from req (set by authenticate middleware)
        // - Return standardized success response with user profile
        try {
            const authReq = req as IAuthenticatedRequest;

            logger.info("AuthController.me", { userUid: authReq.user.uid });

            res.status(200).json({
                success: true,
                message: AUTH_MESSAGES.PROFILE_FETCHED,
                data: { user: authReq.user },
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * GET /auth/permissions
     *
     * Returns the authenticated user's menu permissions, feature permissions,
     * and role capabilities.
     * Requires the `authenticate` middleware to run first.
     */
    permissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;

            logger.info("AuthController.permissions", { userUid: authReq.user.uid });

            const result = await this.authService.getPermissions(
                authReq.user.uid,
                authReq.roleUid,
                authReq.tenantUid
            );


            res.status(200).json({
                success: true,
                message: "Permissions fetched successfully",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * PUT /auth/change-password
     *
     * Allows an authenticated user to change their own password.
     */
    changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;

            logger.info("AuthController.changePassword", { userUid: authReq.user.uid });

            await this.authService.changePassword(authReq.user.uid, req.body);

            res.status(200).json({
                success: true,
                message: AUTH_MESSAGES.PASSWORD_CHANGED,
                data: null,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * POST /auth/forgot-password
     *
     * Initiates the forgot password flow.
     */
    forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { email } = req.body;

            logger.info("AuthController.forgotPassword", { email });

            await this.authService.forgotPassword(email);

            res.status(200).json({
                success: true,
                message: AUTH_MESSAGES.OTP_SENT,
                data: null,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * POST /auth/reset-password
     *
     * Resets the password using an OTP.
     */
    resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            logger.info("AuthController.resetPassword", { email: req.body.email });

            await this.authService.resetPassword(req.body);

            res.status(200).json({
                success: true,
                message: AUTH_MESSAGES.PASSWORD_RESET_SUCCESS,
                data: null,
            });
        } catch (error) {
            next(error);
        }
    };
}

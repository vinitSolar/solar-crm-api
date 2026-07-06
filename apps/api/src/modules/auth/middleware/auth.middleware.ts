import type { Request, Response, NextFunction } from "express";
import type { IAuthenticatedRequest } from "../interfaces/auth.interface.js";
import { verifyAccessToken } from "../utils/jwt.js";
import { AUTH_MESSAGES } from "../constants/auth.constants.js";
import { logger } from "@packages/logger/index.js";
import { AuthRepository } from "../repositories/auth.repository.js";
import { sanitizeUser } from "../utils/token.js";
import pool from "@packages/connection.js";

/**
 * Authentication middleware.
 *
 * Extracts the Bearer token from the Authorization header,
 * verifies it, and attaches the authenticated user context
 * (`user`, `tenantUid`, `roleUid`) to the request object.
 *
 * Must be applied before any route that requires authentication.
 */
export async function authenticate(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    // TODO: Implement authentication middleware
    // - Extract Bearer token from Authorization header
    // - Verify access token
    // - Find user by UID from token payload
    // - Attach user, tenantUid, roleUid to request
    // - Call next() on success, respond 401 on failure
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({
                success: false,
                message: AUTH_MESSAGES.TOKEN_MISSING,
            });
            return;
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            res.status(401).json({
                success: false,
                message: AUTH_MESSAGES.TOKEN_MISSING,
            });
            return;
        }

        const payload = verifyAccessToken(token);

        if (!payload) {
            res.status(401).json({
                success: false,
                message: AUTH_MESSAGES.TOKEN_INVALID,
            });
            return;
        }

        const authRepository = new AuthRepository(pool);
        
        // Fetch session to ensure it is still active (Immediate Invalidation)
        const session = await authRepository.findSessionByUid(payload.sessionUid);
        
        if (!session) {
            res.status(401).json({
                success: false,
                message: AUTH_MESSAGES.SESSION_INVALID,
            });
            return;
        }

        // Fetch user from database to ensure they still exist and are active
        const user = await authRepository.findByUid(payload.userUid);

        if (!user) {
            res.status(401).json({
                success: false,
                message: AUTH_MESSAGES.USER_NOT_FOUND,
            });
            return;
        }

        // Attach authenticated user context to request
        const authReq = req as IAuthenticatedRequest;
        authReq.user = sanitizeUser(user);
        authReq.tenantUid = payload.tenantUid;
        authReq.roleUid = payload.roleUid;

        next();
    } catch (error) {
        logger.error("Authentication middleware error", { error });
        res.status(401).json({
            success: false,
            message: AUTH_MESSAGES.UNAUTHORIZED,
        });
    }
}

/**
 * Authorization middleware factory.
 *
 * Verifies that the authenticated user's role UID is
 * included in the list of allowed roles.
 *
 * Must be applied AFTER the `authenticate` middleware.
 *
 * @param allowedRoles - Array of role UIDs that are permitted.
 * @returns Express middleware function.
 */
export function authorize(...allowedRoles: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        // TODO: Implement authorization middleware
        // - Check if req.user.roleUid is in allowedRoles
        // - Call next() if authorized
        // - Respond 403 if not authorized
        const authReq = req as IAuthenticatedRequest;

        if (!authReq.user || !authReq.roleUid) {
            res.status(401).json({
                success: false,
                message: AUTH_MESSAGES.UNAUTHORIZED,
            });
            return;
        }

        if (allowedRoles.length > 0 && !allowedRoles.includes(authReq.roleUid)) {
            logger.warn("Authorization failed", {
                userUid: authReq.user.uid,
                roleUid: authReq.roleUid,
                requiredRoles: allowedRoles,
            });

            res.status(403).json({
                success: false,
                message: AUTH_MESSAGES.FORBIDDEN,
            });
            return;
        }

        next();
    };
}

import type { Request, Response, NextFunction } from "express";
import { logger } from "@packages/logger/index.js";
import pool from "@packages/connection.js";
import { safeCacheGet, safeCacheSet } from "@packages/redis/index.js";
import type { IAuthenticatedRequest } from "../modules/auth/interfaces/auth.interface.js";
import { FRANCHISE_LOOKUP_MENUS } from "../modules/franchises/constants/franchise-role-permissions.constants.js";

/**
 * Middleware to check if the authenticated user has specific permission for a menu module.
 * 
 * @param menuCode - The code of the menu module (e.g., 'PROJECT_STATUSES')
 * @param action - The action to check ('can_view', 'can_create', 'can_edit', 'can_delete', 'can_setting')
 */
export function requirePermission(menuCode: string, action: 'can_view' | 'can_create' | 'can_edit' | 'can_delete' | 'can_setting') {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const authReq = req as IAuthenticatedRequest;

        if (!authReq.user || !authReq.roleUid || !authReq.tenantUid) {
            res.status(401).json({
                success: false,
                message: "Unauthorized: Missing user context",
            });
            return;
        }

        // Master tenant (Head Office) users might bypass all, or Master role bypasses all.
        // Let's rely on actual DB permissions. For HO Admin, the DB already has all permissions granted.

        const cacheKey = `cache:perm:${authReq.tenantUid}:${authReq.roleUid}:${authReq.user.uid}:${menuCode.toLowerCase()}:${action}`;

        // 1. Fast path: check Redis cache (never throws, returns null if offline)
        const cachedPermission = await safeCacheGet<number>(cacheKey);
        if (cachedPermission !== null) {
            const hasPermission = cachedPermission === 1;

            if (hasPermission) {
                next();
                return;
            }

            if (action === 'can_view' && FRANCHISE_LOOKUP_MENUS.includes(menuCode.toUpperCase())) {
                next();
                return;
            }

            logger.warn("Permission check failed (cached): User lacks required permission", {
                userUid: authReq.user.uid,
                roleUid: authReq.roleUid,
                menuCode,
                action,
            });
            res.status(403).json({
                success: false,
                message: "Forbidden: You do not have permission to perform this action",
            });
            return;
        }

        try {
            const targetCodes =
                menuCode.toLowerCase() === "subsidy_tracker" && action !== "can_setting"
                    ? ["subsidy_tracker", "projects"]
                    : [menuCode.toLowerCase()];

            const query = `
                SELECT 
                    MAX(COALESCE(ump.${action}, rmp.${action}, 0)) AS has_permission
                FROM menus m
                LEFT JOIN role_menu_permissions rmp 
                    ON m.uid = rmp.menu_uid AND rmp.role_uid = $1 AND rmp.tenant_uid = $3
                LEFT JOIN user_menu_permissions ump 
                    ON m.uid = ump.menu_uid AND ump.user_uid = $2 AND ump.tenant_uid = $3
                WHERE LOWER(m.code) = ANY($4) AND m.is_active = 1
            `;

            const result = await pool.query(query, [authReq.roleUid, authReq.user.uid, authReq.tenantUid, targetCodes]);

            if (result.rows.length === 0 || result.rows[0].has_permission === null) {
                logger.warn("Permission check failed: Menu not found or inactive", { menuCode });
                res.status(403).json({
                    success: false,
                    message: "Forbidden: Menu not found or inactive",
                });
                return;
            }

            const hasPermission = Number(result.rows[0].has_permission) === 1;

            // Cache result for 5 minutes (300 seconds) in background
            safeCacheSet(cacheKey, hasPermission ? 1 : 0, 300).catch(() => {});

            if (!hasPermission) {
                // All authenticated CRM users can view master lookup and status data (read-only)
                // to populate status tabs, dropdowns, and filters across mobile and web apps.
                if (action === 'can_view' && FRANCHISE_LOOKUP_MENUS.includes(menuCode.toUpperCase())) {
                    next();
                    return;
                }

                logger.warn("Permission check failed: User lacks required permission", {
                    userUid: authReq.user.uid,
                    roleUid: authReq.roleUid,
                    menuCode,
                    action,
                });
                res.status(403).json({
                    success: false,
                    message: "Forbidden: You do not have permission to perform this action",
                });
                return;
            }

            next();
        } catch (error) {
            logger.error("Permission middleware error", { error });
            res.status(500).json({
                success: false,
                message: "Internal server error during permission check",
            });
        }
    };
}

/**
 * Middleware to check if the authenticated user or their role has a specific feature permission.
 * Evaluates User Feature Permission -> Role Feature Permission -> Default (0).
 * Dynamic and database-driven: no hardcoded role names or admin strings.
 *
 * @param featureCode - The code of the feature (e.g. 'lead_delete')
 */
export function requireFeaturePermission(featureCode: string) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const authReq = req as IAuthenticatedRequest;

        if (!authReq.user || !authReq.roleUid || !authReq.tenantUid) {
            res.status(401).json({
                success: false,
                message: "Unauthorized: Missing user context",
            });
            return;
        }

        const cacheKey = `cache:perm:feature:${authReq.tenantUid}:${authReq.roleUid}:${authReq.user.uid}:${featureCode.toLowerCase()}`;
        const cached = await safeCacheGet<number>(cacheKey);
        if (cached !== null) {
            if (cached === 1) {
                next();
                return;
            }
            logger.warn("Feature permission check failed (cached): User/Role lacks feature permission", {
                userUid: authReq.user.uid,
                roleUid: authReq.roleUid,
                featureCode,
            });
            res.status(403).json({
                success: false,
                message: `Forbidden: You do not have permission for feature '${featureCode}'`,
            });
            return;
        }

        try {
            const query = `
                SELECT 
                    COALESCE(ufp.is_enabled, rfp.is_enabled, 0) AS is_enabled
                FROM features f
                LEFT JOIN role_feature_permissions rfp 
                    ON f.uid = rfp.feature_uid AND rfp.role_uid = $1 AND rfp.tenant_uid = $3
                LEFT JOIN user_feature_permissions ufp 
                    ON f.uid = ufp.feature_uid AND ufp.user_uid = $2 AND ufp.tenant_uid = $3
                WHERE LOWER(f.code) = LOWER($4) AND f.is_active = 1
            `;

            const result = await pool.query(query, [
                authReq.roleUid,
                authReq.user.uid,
                authReq.tenantUid,
                featureCode,
            ]);

            const isEnabled = result.rows.length > 0 && result.rows[0].is_enabled === 1;

            // Cache result for 5 minutes (300 seconds) in background
            safeCacheSet(cacheKey, isEnabled ? 1 : 0, 300).catch(() => {});

            if (!isEnabled) {
                logger.warn("Feature permission check failed: User/Role lacks feature permission", {
                    userUid: authReq.user.uid,
                    roleUid: authReq.roleUid,
                    featureCode,
                });
                res.status(403).json({
                    success: false,
                    message: `Forbidden: You do not have permission for feature '${featureCode}'`,
                });
                return;
            }

            next();
        } catch (error) {
            logger.error("Feature permission middleware error", { error });
            res.status(500).json({
                success: false,
                message: "Internal server error during permission check",
            });
        }
    };
}

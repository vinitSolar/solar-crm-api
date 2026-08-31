import type { Request, Response, NextFunction } from "express";
import { logger } from "@packages/logger/index.js";
import pool from "@packages/connection.js";
import type { IAuthenticatedRequest } from "../modules/auth/interfaces/auth.interface.js";

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

        try {
            const query = `
                SELECT 
                    COALESCE(ump.${action}, rmp.${action}, 0) AS has_permission
                FROM menus m
                LEFT JOIN role_menu_permissions rmp 
                    ON m.uid = rmp.menu_uid AND rmp.role_uid = $1 AND rmp.tenant_uid = $3
                LEFT JOIN user_menu_permissions ump 
                    ON m.uid = ump.menu_uid AND ump.user_uid = $2 AND ump.tenant_uid = $3
                WHERE m.code = $4 AND m.is_active = 1
            `;

            const result = await pool.query(query, [authReq.roleUid, authReq.user.uid, authReq.tenantUid, menuCode]);

            if (result.rows.length === 0) {
                logger.warn("Permission check failed: Menu not found or inactive", { menuCode });
                res.status(403).json({
                    success: false,
                    message: "Forbidden: Menu not found or inactive",
                });
                return;
            }

            const hasPermission = result.rows[0].has_permission === 1;

            if (!hasPermission) {
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

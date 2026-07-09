import type { Request, Response, NextFunction } from "express";
import type { RolePermissionService } from "../services/role-permission.service.js";
import type { IAuthenticatedRequest } from "../../auth/interfaces/auth.interface.js";
import type { IUpsertRoleMenuPermission } from "../interfaces/role-permission.interface.js";
import { ROLE_PERMISSION_MESSAGES } from "../constants/role-permission.constants.js";
import { logger } from "@packages/logger/index.js";

/**
 * Role Permission Controller.
 * Thin controller — no business logic, no SQL.
 */
export class RolePermissionController {
    private readonly rolePermissionService: RolePermissionService;

    constructor(rolePermissionService: RolePermissionService) {
        this.rolePermissionService = rolePermissionService;
    }

    /**
     * GET /roles/:roleUid/menu-permissions
     */
    getMenuPermissions = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const { roleUid } = req.params;

            logger.info("RolePermissionController.getMenuPermissions", {
                roleUid,
                tenantUid: authReq.tenantUid,
            });

            const permissions = await this.rolePermissionService.getMenuPermissions(
                roleUid!,
                authReq.tenantUid,
            );

            res.status(200).json({
                success: true,
                message: ROLE_PERMISSION_MESSAGES.MENU_PERMISSIONS_FETCHED,
                data: permissions,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * PUT /roles/:roleUid/menu-permissions
     */
    upsertMenuPermissions = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const { roleUid } = req.params;
            const { permissions } = req.body as { permissions: IUpsertRoleMenuPermission[] };

            logger.info("RolePermissionController.upsertMenuPermissions", {
                roleUid,
                tenantUid: authReq.tenantUid,
                count: permissions.length,
            });

            await this.rolePermissionService.upsertMenuPermissions(
                roleUid!,
                authReq.tenantUid,
                permissions,
            );

            res.status(200).json({
                success: true,
                message: ROLE_PERMISSION_MESSAGES.MENU_PERMISSIONS_UPDATED,
                data: null,
            });
        } catch (error) {
            next(error);
        }
    };
}

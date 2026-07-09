import type { Request, Response, NextFunction } from "express";
import { CustomError } from "../../../middlewares/error.middleware.js";
import type { UserPermissionService } from "../services/user-permission.service.js";
import type { IAuthenticatedRequest } from "../../auth/interfaces/auth.interface.js";
import type { IUpsertUserMenuPermission } from "../interfaces/user-permission.interface.js";

export class UserPermissionController {
    constructor(private readonly userPermissionService: UserPermissionService) {}

    /**
     * Get menu permissions for a specific user
     */
    getMenuPermissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const authReq = req as IAuthenticatedRequest;
        const userUid = authReq.params.userUid as string;

        if (!userUid) {
            throw new CustomError("User UID is required", 400);
        }

        const permissions = await this.userPermissionService.getMenuPermissions(authReq.tenantUid, userUid);

        res.status(200).json({
            success: true,
            message: "User menu permissions fetched successfully",
            data: permissions,
        });
    };

    /**
     * Upsert (replace) menu permissions for a specific user
     */
    upsertMenuPermissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const authReq = req as IAuthenticatedRequest;
        const userUid = authReq.params.userUid as string;
        const { permissions } = req.body as { permissions: IUpsertUserMenuPermission[] };

        if (!userUid) {
            throw new CustomError("User UID is required", 400);
        }

        await this.userPermissionService.upsertMenuPermissions(authReq.tenantUid, userUid, permissions);

        res.status(200).json({
            success: true,
            message: "User menu permissions updated successfully",
            data: null,
        });
    };
}

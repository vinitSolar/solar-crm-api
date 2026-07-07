import type { Request, Response, NextFunction } from "express";
import type { RoleService } from "../services/role.service.js";
import type { IAuthenticatedRequest } from "../../auth/interfaces/auth.interface.js";
import type { ICreateRoleRequest, IUpdateRoleRequest } from "../interfaces/role.interface.js";
import { ROLE_MESSAGES } from "../constants/role.constants.js";
import { logger } from "@packages/logger/index.js";

export class RoleController {
    private readonly roleService: RoleService;

    constructor(roleService: RoleService) {
        this.roleService = roleService;
    }

    getRoles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            logger.info("RoleController.getRoles", { tenantUid: authReq.tenantUid });

            const page = req.body.page ? parseInt(req.body.page as string, 10) : 1;
            const limit = req.body.limit ? parseInt(req.body.limit as string, 10) : 10;
            const search = req.body.search as string | undefined;
            const status = req.body.status as "active" | "deleted" | "all" | undefined;

            const query: import("../interfaces/role.interface.js").IPaginationQuery = { page, limit };
            if (search) {
                query.search = search;
            }
            if (status) {
                query.status = status;
            }

            const paginatedResponse = await this.roleService.getRolesByTenant(authReq.tenantUid, query);

            res.status(200).json({
                success: true,
                message: ROLE_MESSAGES.FETCHED_SUCCESS,
                ...paginatedResponse,
            });
        } catch (error) {
            next(error);
        }
    };

    getAllRoles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const status = req.query.status as "active" | "deleted" | "all" | undefined;
            logger.info("RoleController.getAllRoles", { tenantUid: authReq.tenantUid, status });

            const roles = await this.roleService.getAllRolesByTenant(authReq.tenantUid, status);

            res.status(200).json({
                success: true,
                message: ROLE_MESSAGES.FETCHED_ALL_SUCCESS,
                data: roles,
            });
        } catch (error) {
            next(error);
        }
    };

    getRoleByUid = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const uid = req.params.uid as string;
            logger.info("RoleController.getRoleByUid", { uid, tenantUid: authReq.tenantUid });

            const role = await this.roleService.getRoleByUid(uid, authReq.tenantUid);

            res.status(200).json({
                success: true,
                message: ROLE_MESSAGES.FETCHED_ONE_SUCCESS,
                data: { role },
            });
        } catch (error) {
            next(error);
        }
    };

    createRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const data = req.body as ICreateRoleRequest;
            
            logger.info("RoleController.createRole", { tenantUid: authReq.tenantUid });

            const role = await this.roleService.createRole(authReq.tenantUid, data, authReq.user.uid);

            res.status(201).json({
                success: true,
                message: ROLE_MESSAGES.CREATED_SUCCESS,
                data: { role },
            });
        } catch (error) {
            next(error);
        }
    };

    updateRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const uid = req.params.uid as string;
            const data = req.body as IUpdateRoleRequest;
            
            logger.info("RoleController.updateRole", { uid, tenantUid: authReq.tenantUid });

            const role = await this.roleService.updateRole(uid, authReq.tenantUid, data, authReq.user.uid);

            res.status(200).json({
                success: true,
                message: ROLE_MESSAGES.UPDATED_SUCCESS,
                data: { role },
            });
        } catch (error) {
            next(error);
        }
    };

    deleteRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const uid = req.params.uid as string;
            
            logger.info("RoleController.deleteRole", { uid, tenantUid: authReq.tenantUid });

            await this.roleService.deleteRole(uid, authReq.tenantUid, authReq.user.uid);

            res.status(200).json({
                success: true,
                message: ROLE_MESSAGES.DELETED_SUCCESS,
                data: null,
            });
        } catch (error) {
            next(error);
        }
    };

    restoreRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const uid = req.params.uid as string;
            
            logger.info("RoleController.restoreRole", { uid, tenantUid: authReq.tenantUid });

            await this.roleService.restoreRole(uid, authReq.tenantUid, authReq.user.uid);

            res.status(200).json({
                success: true,
                message: ROLE_MESSAGES.RESTORED_SUCCESS,
                data: null,
            });
        } catch (error) {
            next(error);
        }
    };
}

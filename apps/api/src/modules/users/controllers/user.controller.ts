import type { Request, Response, NextFunction } from "express";
import type { UserService } from "../services/user.service.js";
import type { IAuthenticatedRequest } from "../../auth/interfaces/auth.interface.js";
import type { ICreateUserRequest, IUpdateUserRequest, IPaginationQuery } from "../interfaces/user.interface.js";
import { USER_MESSAGES } from "../constants/user.constants.js";
import { logger } from "@packages/logger/index.js";

export class UserController {
    private readonly userService: UserService;

    constructor(userService: UserService) {
        this.userService = userService;
    }

    getUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            logger.info("UserController.getUsers", { tenantUid: authReq.tenantUid });

            const page = req.body.page ? parseInt(req.body.page as string, 10) : 1;
            const limit = req.body.limit ? parseInt(req.body.limit as string, 10) : 10;
            const search = req.body.search as string | undefined;
            const status = req.body.status as "active" | "deleted" | "all" | undefined;

            const query: IPaginationQuery = { page, limit };
            if (search) {
                query.search = search;
            }
            if (status) {
                query.status = status;
            }
            if (req.body.canSiteSurvey !== undefined) {
                query.canSiteSurvey = req.body.canSiteSurvey as number;
            }
            if (req.body.canInstallation !== undefined) {
                query.canInstallation = req.body.canInstallation as number;
            }

            const paginatedResponse = await this.userService.getUsersByTenant(authReq.tenantUid, query);

            res.status(200).json({
                success: true,
                message: USER_MESSAGES.FETCHED_SUCCESS,
                data: paginatedResponse.users,
                meta: paginatedResponse.meta,
            });
        } catch (error) {
            next(error);
        }
    };

    getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const status = req.body.status as "active" | "deleted" | "all" | undefined;
            const canSiteSurvey = req.body.canSiteSurvey !== undefined ? Number(req.body.canSiteSurvey) : undefined;
            const canInstallation = req.body.canInstallation !== undefined ? Number(req.body.canInstallation) : undefined;
            logger.info("UserController.getAllUsers", { tenantUid: authReq.tenantUid, status });

            const users = await this.userService.getAllUsersByTenant(authReq.tenantUid, status, canSiteSurvey, canInstallation);

            res.status(200).json({
                success: true,
                message: USER_MESSAGES.FETCHED_ALL_SUCCESS,
                data: users,
            });
        } catch (error) {
            next(error);
        }
    };

    getUserByUid = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const uid = req.params.uid as string;
            logger.info("UserController.getUserByUid", { uid, tenantUid: authReq.tenantUid });

            const user = await this.userService.getUserByUid(uid, authReq.tenantUid);

            res.status(200).json({
                success: true,
                message: USER_MESSAGES.FETCHED_ONE_SUCCESS,
                data: { user },
            });
        } catch (error) {
            next(error);
        }
    };

    createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const data = req.body as ICreateUserRequest;
            
            logger.info("UserController.createUser", { tenantUid: authReq.tenantUid });

            const user = await this.userService.createUser(authReq.tenantUid, data, authReq.user.uid);

            res.status(201).json({
                success: true,
                message: USER_MESSAGES.CREATED_SUCCESS,
                data: { user },
            });
        } catch (error) {
            next(error);
        }
    };

    updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const uid = req.params.uid as string;
            const data = req.body as IUpdateUserRequest;
            
            logger.info("UserController.updateUser", { uid, tenantUid: authReq.tenantUid });

            const user = await this.userService.updateUser(uid, authReq.tenantUid, data, authReq.user.uid);

            res.status(200).json({
                success: true,
                message: USER_MESSAGES.UPDATED_SUCCESS,
                data: { user },
            });
        } catch (error) {
            next(error);
        }
    };

    deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const uid = req.params.uid as string;
            
            logger.info("UserController.deleteUser", { uid, tenantUid: authReq.tenantUid });

            await this.userService.deleteUser(uid, authReq.tenantUid, authReq.user.uid);

            res.status(200).json({
                success: true,
                message: USER_MESSAGES.DELETED_SUCCESS,
                data: null,
            });
        } catch (error) {
            next(error);
        }
    };

    restoreUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const uid = req.params.uid as string;
            
            logger.info("UserController.restoreUser", { uid, tenantUid: authReq.tenantUid });

            await this.userService.restoreUser(uid, authReq.tenantUid, authReq.user.uid);

            res.status(200).json({
                success: true,
                message: USER_MESSAGES.RESTORED_SUCCESS,
                data: null,
            });
        } catch (error) {
            next(error);
        }
    };
}

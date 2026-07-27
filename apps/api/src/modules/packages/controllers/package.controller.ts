import type { Request, Response, NextFunction } from "express";
import type { IAuthenticatedRequest } from "../../auth/interfaces/auth.interface.js";
import { PackageService } from "../services/package.service.js";
import { PACKAGE_MESSAGES } from "../constants/messages.js";

export class PackageController {
    private readonly service: PackageService;

    constructor(service: PackageService) {
        this.service = service;
    }

    createPackage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const userUid = authReq.user.uid;
            
            const data = req.body;
            const pkg = await this.service.createPackage(tenantUid, userUid, data);

            res.status(201).json({
                success: true,
                message: PACKAGE_MESSAGES.CREATED_SUCCESS,
                data: pkg,
            });
        } catch (error) {
            next(error);
        }
    };

    updatePackage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const uid = req.params.uid as string;
            const tenantUid = authReq.tenantUid;
            const userUid = authReq.user.uid;
            
            const data = req.body;
            await this.service.updatePackage(uid, tenantUid, userUid, data);

            res.status(200).json({
                success: true,
                message: PACKAGE_MESSAGES.UPDATED_SUCCESS,
                data: null
            });
        } catch (error) {
            next(error);
        }
    };

    getPackageByUid = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const uid = req.params.uid as string;
            const tenantUid = authReq.tenantUid;
            
            const pkg = await this.service.getPackageByUid(uid, tenantUid);

            res.status(200).json({
                success: true,
                message: PACKAGE_MESSAGES.FETCHED_SUCCESS,
                data: pkg,
            });
        } catch (error) {
            next(error);
        }
    };

    getPaginatedPackages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            
            const params = req.body;
            const result = await this.service.listPackages(tenantUid, params);

            res.status(200).json({
                success: true,
                message: PACKAGE_MESSAGES.LIST_FETCHED_SUCCESS,
                data: result.data,
                meta: {
                    total: result.total,
                    page: params.page,
                    limit: params.limit,
                    totalPages: result.totalPages,
                }
            });
        } catch (error) {
            next(error);
        }
    };

    getDropdownPackages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const status = req.query.status as "active" | "deleted" | "all" | undefined;
            
            const packages = await this.service.getDropdownPackages(tenantUid, status);

            res.status(200).json({
                success: true,
                message: PACKAGE_MESSAGES.LIST_FETCHED_SUCCESS,
                data: packages,
            });
        } catch (error) {
            next(error);
        }
    };

    deletePackage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const uid = req.params.uid as string;
            const tenantUid = authReq.tenantUid;
            const userUid = authReq.user.uid;
            
            await this.service.deletePackage(uid, tenantUid, userUid);

            res.status(200).json({
                success: true,
                message: PACKAGE_MESSAGES.DELETED_SUCCESS,
                data: null
            });
        } catch (error) {
            next(error);
        }
    };

    restorePackage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const uid = req.params.uid as string;
            const tenantUid = authReq.tenantUid;
            const userUid = authReq.user.uid;
            
            await this.service.restorePackage(uid, tenantUid, userUid);

            res.status(200).json({
                success: true,
                message: PACKAGE_MESSAGES.RESTORED_SUCCESS,
                data: null
            });
        } catch (error) {
            next(error);
        }
    };
}

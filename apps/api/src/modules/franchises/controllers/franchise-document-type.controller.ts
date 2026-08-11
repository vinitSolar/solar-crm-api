import type { Request, Response, NextFunction } from "express";
import type { FranchiseDocumentTypeService } from "../services/franchise-document-type.service.js";
import type { IAuthenticatedRequest } from "../../auth/interfaces/auth.interface.js";
import { logger } from "@packages/logger/index.js";

export class FranchiseDocumentTypeController {
    private readonly service: FranchiseDocumentTypeService;

    constructor(service: FranchiseDocumentTypeService) {
        this.service = service;
    }

    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.user.tenantUid; // Franchise Admin has a tenantUid, or SuperAdmin acts on behalf. Wait, if it's Franchise Document Types, tenantUid must be from token.
            // If the user doesn't have a tenantUid (e.g. system admin), they shouldn't be creating franchise document types without specifying a tenant.
            // But this controller is for Franchise Admins to configure their own document types.
            if (!tenantUid) {
                res.status(403).json({ success: false, message: "Forbidden: No tenant associated with user" });
                return;
            }

            logger.info("FranchiseDocumentTypeController.create", { tenantUid, userUid: authReq.user.uid });
            const docType = await this.service.createDocumentType(tenantUid, req.body, authReq.user.uid);

            res.status(201).json({
                success: true,
                message: "Document type created successfully",
                data: docType,
            });
        } catch (error) {
            next(error);
        }
    };

    getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.user.tenantUid;
            if (!tenantUid) {
                res.status(403).json({ success: false, message: "Forbidden: No tenant associated with user" });
                return;
            }
            const status = req.query.status as string | undefined;

            logger.info("FranchiseDocumentTypeController.getAll", { tenantUid, status });
            const docTypes = await this.service.getAllDocumentTypes(tenantUid, status);

            res.status(200).json({
                success: true,
                message: "Document types fetched successfully",
                data: docTypes,
            });
        } catch (error) {
            next(error);
        }
    };

    getPaginated = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.user.tenantUid;
            if (!tenantUid) {
                res.status(403).json({ success: false, message: "Forbidden: No tenant associated with user" });
                return;
            }

            const { page = 1, limit = 10, search, status } = req.body;

            logger.info("FranchiseDocumentTypeController.getPaginated", { tenantUid, page, limit });
            const result = await this.service.getPaginatedDocumentTypes(
                tenantUid,
                Number(page),
                Number(limit),
                search as string | undefined,
                status as string | undefined
            );

            res.status(200).json({
                success: true,
                message: "Document types fetched successfully",
                data: result.rows,
                meta: {
                    total: result.total,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(result.total / Number(limit)),
                },
            });
        } catch (error) {
            next(error);
        }
    };

    getByUid = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.user.tenantUid;
            if (!tenantUid) {
                res.status(403).json({ success: false, message: "Forbidden: No tenant associated with user" });
                return;
            }
            const uid = req.params.uid as string;

            logger.info("FranchiseDocumentTypeController.getByUid", { tenantUid, uid });
            const docType = await this.service.getDocumentTypeByUid(tenantUid, uid);

            res.status(200).json({
                success: true,
                message: "Document type fetched successfully",
                data: docType,
            });
        } catch (error) {
            next(error);
        }
    };

    update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.user.tenantUid;
            if (!tenantUid) {
                res.status(403).json({ success: false, message: "Forbidden: No tenant associated with user" });
                return;
            }
            const uid = req.params.uid as string;

            logger.info("FranchiseDocumentTypeController.update", { tenantUid, uid });
            const docType = await this.service.updateDocumentType(tenantUid, uid, req.body, authReq.user.uid);

            res.status(200).json({
                success: true,
                message: "Document type updated successfully",
                data: docType,
            });
        } catch (error) {
            next(error);
        }
    };

    delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.user.tenantUid;
            if (!tenantUid) {
                res.status(403).json({ success: false, message: "Forbidden: No tenant associated with user" });
                return;
            }
            const uid = req.params.uid as string;

            logger.info("FranchiseDocumentTypeController.delete", { tenantUid, uid });
            await this.service.deleteDocumentType(tenantUid, uid, authReq.user.uid);

            res.status(200).json({
                success: true,
                message: "Document type deleted successfully",
                data: null,
            });
        } catch (error) {
            next(error);
        }
    };

    restore = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.user.tenantUid;
            if (!tenantUid) {
                res.status(403).json({ success: false, message: "Forbidden: No tenant associated with user" });
                return;
            }
            const uid = req.params.uid as string;

            logger.info("FranchiseDocumentTypeController.restore", { tenantUid, uid });
            await this.service.restoreDocumentType(tenantUid, uid, authReq.user.uid);

            res.status(200).json({
                success: true,
                message: "Document type restored successfully",
                data: null,
            });
        } catch (error) {
            next(error);
        }
    };
}

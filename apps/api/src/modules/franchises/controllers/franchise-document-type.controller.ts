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

            logger.info("FranchiseDocumentTypeController.create", { userUid: authReq.user.uid });
            const docType = await this.service.createDocumentType(req.body, authReq.user.uid);

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
            const status = req.query.status as string | undefined;

            logger.info("FranchiseDocumentTypeController.getAll", { status });
            const docTypes = await this.service.getAllDocumentTypes(status);

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
            const { page = 1, limit = 10, search, status } = req.body;

            logger.info("FranchiseDocumentTypeController.getPaginated", { page, limit });
            const result = await this.service.getPaginatedDocumentTypes(
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
            const uid = req.params.uid as string;

            logger.info("FranchiseDocumentTypeController.getByUid", { uid });
            const docType = await this.service.getDocumentTypeByUid(uid);

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
            const uid = req.params.uid as string;

            logger.info("FranchiseDocumentTypeController.update", { uid });
            const docType = await this.service.updateDocumentType(uid, req.body, authReq.user.uid);

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
            const uid = req.params.uid as string;

            logger.info("FranchiseDocumentTypeController.delete", { uid });
            await this.service.deleteDocumentType(uid, authReq.user.uid);

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
            const uid = req.params.uid as string;

            logger.info("FranchiseDocumentTypeController.restore", { uid });
            await this.service.restoreDocumentType(uid, authReq.user.uid);

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

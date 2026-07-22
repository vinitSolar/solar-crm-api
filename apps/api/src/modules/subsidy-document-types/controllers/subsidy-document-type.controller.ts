import type { Request, Response, NextFunction } from "express";
import type { SubsidyDocumentTypeService } from "../services/subsidy-document-type.service.js";
import type { IAuthenticatedRequest } from "../../auth/interfaces/auth.interface.js";
import { SUBSIDY_DOCUMENT_TYPE_MESSAGES } from "../constants/subsidy-document-type.constants.js";

export class SubsidyDocumentTypeController {
    private readonly service: SubsidyDocumentTypeService;

    constructor(service: SubsidyDocumentTypeService) {
        this.service = service;
    }

    public createDocumentType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const docType = await this.service.createDocumentType(req.body, authReq.user.uid, authReq.tenantUid);
            res.status(201).json({
                success: true,
                message: SUBSIDY_DOCUMENT_TYPE_MESSAGES.CREATED,
                data: docType,
            });
        } catch (error) {
            next(error);
        }
    };

    public updateDocumentType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const uid = req.params.uid as string;
            const authReq = req as IAuthenticatedRequest;
            const docType = await this.service.updateDocumentType(uid, req.body, authReq.user.uid, authReq.tenantUid);
            res.status(200).json({
                success: true,
                message: SUBSIDY_DOCUMENT_TYPE_MESSAGES.UPDATED,
                data: docType,
            });
        } catch (error) {
            next(error);
        }
    };

    public getDocumentTypeByUid = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const uid = req.params.uid as string;
            const docType = await this.service.getDocumentTypeByUid(uid);
            res.status(200).json({
                success: true,
                message: SUBSIDY_DOCUMENT_TYPE_MESSAGES.FETCHED,
                data: docType,
            });
        } catch (error) {
            next(error);
        }
    };

    public getPaginatedDocumentTypes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.service.getPaginatedDocumentTypes(req.body);
            res.status(200).json({
                success: true,
                message: SUBSIDY_DOCUMENT_TYPE_MESSAGES.FETCHED,
                data: result.data,
                meta: {
                    total: result.total,
                    page: req.body.page,
                    limit: req.body.limit,
                    totalPages: result.totalPages,
                },
            });
        } catch (error) {
            next(error);
        }
    };

    public getAllDocumentTypes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const status = (req.query.status as "active" | "deleted" | "all") || "active";
            const docTypes = await this.service.getAllDocumentTypes(status);
            res.status(200).json({
                success: true,
                message: SUBSIDY_DOCUMENT_TYPE_MESSAGES.FETCHED,
                data: docTypes,
            });
        } catch (error) {
            next(error);
        }
    };

    public deleteDocumentType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const uid = req.params.uid as string;
            const authReq = req as IAuthenticatedRequest;
            await this.service.softDeleteDocumentType(uid, authReq.user.uid, authReq.tenantUid);
            res.status(200).json({
                success: true,
                message: SUBSIDY_DOCUMENT_TYPE_MESSAGES.DELETED,
                data: null,
            });
        } catch (error) {
            next(error);
        }
    };

    public restoreDocumentType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const uid = req.params.uid as string;
            const authReq = req as IAuthenticatedRequest;
            await this.service.restoreDocumentType(uid, authReq.user.uid, authReq.tenantUid);
            res.status(200).json({
                success: true,
                message: SUBSIDY_DOCUMENT_TYPE_MESSAGES.RESTORED,
                data: null,
            });
        } catch (error) {
            next(error);
        }
    };
}

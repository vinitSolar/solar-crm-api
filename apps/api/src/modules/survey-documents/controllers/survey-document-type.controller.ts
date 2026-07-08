import type { Request, Response, NextFunction } from "express";
import type { SurveyDocumentTypeService } from "../services/survey-document-type.service.js";
import { SURVEY_DOCUMENT_TYPE_MESSAGES } from "../constants/survey-documents.constants.js";
import type { IAuthenticatedRequest } from "../../auth/interfaces/auth.interface.js";

export class SurveyDocumentTypeController {
    private readonly service: SurveyDocumentTypeService;

    constructor(service: SurveyDocumentTypeService) {
        this.service = service;
    }

    createDocumentType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const createdBy = authReq.user.uid;
            
            const type = await this.service.createDocumentType(tenantUid, req.body, createdBy);

            res.status(201).json({
                success: true,
                message: SURVEY_DOCUMENT_TYPE_MESSAGES.CREATED,
                data: type,
            });
        } catch (error) {
            next(error);
        }
    };

    getPaginatedDocumentTypes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const result = await this.service.getPaginatedDocumentTypes(tenantUid, req.body);

            res.status(200).json({
                success: true,
                message: SURVEY_DOCUMENT_TYPE_MESSAGES.FETCHED,
                data: result.data,
                meta: result.meta,
            });
        } catch (error) {
            next(error);
        }
    };

    getAllDocumentTypes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const status = req.query.status as string | undefined;

            const types = await this.service.getAllDocumentTypes(tenantUid, status);

            res.status(200).json({
                success: true,
                message: SURVEY_DOCUMENT_TYPE_MESSAGES.FETCHED,
                data: types,
            });
        } catch (error) {
            next(error);
        }
    };

    getDocumentTypeByUid = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const uid = req.params.uid as string;
            const type = await this.service.getDocumentTypeByUid(tenantUid, uid);

            res.status(200).json({
                success: true,
                message: SURVEY_DOCUMENT_TYPE_MESSAGES.FETCHED,
                data: type,
            });
        } catch (error) {
            next(error);
        }
    };

    updateDocumentType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const updatedBy = authReq.user.uid;
            const uid = req.params.uid as string;
            const type = await this.service.updateDocumentType(tenantUid, uid, req.body, updatedBy);

            res.status(200).json({
                success: true,
                message: SURVEY_DOCUMENT_TYPE_MESSAGES.UPDATED,
                data: type,
            });
        } catch (error) {
            next(error);
        }
    };

    deleteDocumentType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const deletedBy = authReq.user.uid;
            const uid = req.params.uid as string;
            await this.service.deleteDocumentType(tenantUid, uid, deletedBy);

            res.status(200).json({
                success: true,
                message: SURVEY_DOCUMENT_TYPE_MESSAGES.DELETED,
                data: null,
            });
        } catch (error) {
            next(error);
        }
    };
}

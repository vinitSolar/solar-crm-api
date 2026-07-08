import type { Request, Response, NextFunction } from "express";
import type { SurveyDocumentService } from "../services/survey-document.service.js";
import { SURVEY_DOCUMENT_MESSAGES } from "../constants/survey-documents.constants.js";
import type { IAuthenticatedRequest } from "../../auth/interfaces/auth.interface.js";

export class SurveyDocumentController {
    private readonly service: SurveyDocumentService;

    constructor(service: SurveyDocumentService) {
        this.service = service;
    }

    uploadDocuments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const createdBy = authReq.user.uid;
            
            const siteSurveyUid = req.params.uid as string; // since mounted as /site-surveys/:uid/documents
            const { document_type_uid, remarks } = req.body;
            
            const files = req.files as Express.Multer.File[];

            const docs = await this.service.uploadDocuments(
                tenantUid,
                siteSurveyUid,
                document_type_uid,
                remarks,
                files,
                createdBy
            );

            res.status(201).json({
                success: true,
                message: SURVEY_DOCUMENT_MESSAGES.UPLOADED,
                data: docs,
            });
        } catch (error) {
            next(error);
        }
    };

    getDocumentsBySurveyUid = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const siteSurveyUid = req.params.uid as string;

            const docs = await this.service.getDocumentsBySurveyUid(tenantUid, siteSurveyUid);

            res.status(200).json({
                success: true,
                message: SURVEY_DOCUMENT_MESSAGES.FETCHED,
                data: docs,
            });
        } catch (error) {
            next(error);
        }
    };

    deleteDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const deletedBy = authReq.user.uid;
            const documentUid = req.params.document_uid as string;

            await this.service.deleteDocument(tenantUid, documentUid, deletedBy);

            res.status(200).json({
                success: true,
                message: SURVEY_DOCUMENT_MESSAGES.DELETED,
                data: null,
            });
        } catch (error) {
            next(error);
        }
    };
}

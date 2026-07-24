import fs from "fs";
import path from "path";
import type { Request, Response, NextFunction } from "express";
import type { SubsidyTrackerService } from "../services/subsidy-tracker.service.js";
import { SUBSIDY_TRACKER_MESSAGES } from "../constants/subsidy-tracker.constants.js";

// Import IAuthenticatedRequest if available or define it
export interface IAuthenticatedRequest extends Request {
    user?: any;
    tenantUid?: string;
}

export class SubsidyTrackerController {
    private readonly service: SubsidyTrackerService;

    constructor(service: SubsidyTrackerService) {
        this.service = service;
    }

    listPaginated = async (req: Request, res: Response): Promise<void> => {
        const authReq = req as IAuthenticatedRequest;
        const tenantUid = authReq.tenantUid || authReq.user?.tenantUid;
        const result = await this.service.listPaginated(tenantUid, req.body);
        res.status(200).json({
            success: true,
            message: SUBSIDY_TRACKER_MESSAGES.FETCHED_SUCCESSFULLY,
            ...result,
        });
    };

    getByUid = async (req: Request, res: Response): Promise<void> => {
        const authReq = req as IAuthenticatedRequest;
        const tenantUid = authReq.tenantUid || authReq.user?.tenantUid;
        const uid = req.params.uid as string;
        const tracker = await this.service.getByUid(tenantUid, uid);
        res.status(200).json({
            success: true,
            message: SUBSIDY_TRACKER_MESSAGES.FETCHED_SUCCESSFULLY,
            data: tracker,
        });
    };

    update = async (req: Request, res: Response): Promise<void> => {
        const authReq = req as IAuthenticatedRequest;
        const tenantUid = authReq.tenantUid || authReq.user?.tenantUid;
        const userUid = authReq.user?.uid || authReq.user?.userUid;
        const uid = req.params.uid as string;
        
        const updated = await this.service.update(tenantUid, uid, req.body, userUid);
        res.status(200).json({
            success: true,
            message: SUBSIDY_TRACKER_MESSAGES.UPDATED,
            data: updated,
        });
    };

    uploadDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid || authReq.user?.tenantUid;
            const userUid = authReq.user?.uid || authReq.user?.userUid;
            const uid = req.params.uid as string;
            const documentData = req.body;
            const ipAddress = req.ip || "Unknown";
            const userAgent = req.headers["user-agent"] || "Unknown";

            if (!req.file) {
                res.status(400).json({ success: false, message: "File is required" });
                return;
            }
            if (!documentData.documentTypeUid) {
                res.status(400).json({ success: false, message: "documentTypeUid is required" });
                return;
            }

            const uploadDir = path.join(process.cwd(), "public", "uploads", "franchises", "projects", uid, "subsidy-docs");
            await fs.promises.mkdir(uploadDir, { recursive: true });

            const fileName = `${Date.now()}_${req.file.originalname}`;
            const filePath = path.join(uploadDir, fileName);
            await fs.promises.writeFile(filePath, req.file.buffer);

            const fileUrl = `/uploads/franchises/projects/${uid}/subsidy-docs/${fileName}`;

            const document = await this.service.uploadDocument(
                tenantUid, 
                uid, 
                {
                    documentTypeUid: documentData.documentTypeUid,
                    remarks: documentData.remarks,
                    originalName: req.file.originalname,
                    fileName: fileName,
                    fileUrl: fileUrl,
                    mimeType: req.file.mimetype,
                    fileSize: req.file.size,
                }, 
                userUid
            );
            
            res.status(201).json({
                success: true,
                message: SUBSIDY_TRACKER_MESSAGES.DOCUMENT_UPLOADED,
                data: document,
            });
        } catch (error) {
            next(error);
        }
    };

    deleteDocument = async (req: Request, res: Response): Promise<void> => {
        const authReq = req as IAuthenticatedRequest;
        const tenantUid = authReq.tenantUid || authReq.user?.tenantUid;
        const userUid = authReq.user?.uid || authReq.user?.userUid;
        const uid = req.params.uid as string;
        const documentUid = req.params.documentUid as string;

        await this.service.deleteDocument(tenantUid, uid, documentUid, userUid);
        res.status(200).json({
            success: true,
            message: SUBSIDY_TRACKER_MESSAGES.DOCUMENT_DELETED,
            data: null,
        });
    };
}

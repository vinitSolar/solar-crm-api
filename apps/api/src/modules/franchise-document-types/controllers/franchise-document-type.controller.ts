import type { Request, Response } from "express";
import { asyncHandler } from "../../../utils/async-handler.js";
import type { FranchiseDocumentTypeService } from "../services/franchise-document-type.service.js";
import type { IAuthenticatedRequest } from "../../auth/interfaces/auth.interface.js";
import { FRANCHISE_DOCUMENT_TYPE_MESSAGES } from "../constants/franchise-document-type.constants.js";

export class FranchiseDocumentTypeController {
    private readonly service: FranchiseDocumentTypeService;

    constructor(service: FranchiseDocumentTypeService) {
        this.service = service;
    }

    public createFranchiseDocumentType = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const authReq = req as IAuthenticatedRequest;
        const tenantUid = authReq.tenantUid;
        const createdBy = authReq.user.uid;

        const type = await this.service.createFranchiseDocumentType(tenantUid, req.body, createdBy);
        res.status(201).json({
            success: true,
            message: FRANCHISE_DOCUMENT_TYPE_MESSAGES.CREATED,
            data: type,
        });
    });

    public getFranchiseDocumentTypeByUid = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const authReq = req as IAuthenticatedRequest;
        const tenantUid = authReq.tenantUid;
        const uid = req.params.uid as string;

        const type = await this.service.getFranchiseDocumentTypeByUid(tenantUid, uid);
        res.status(200).json({
            success: true,
            message: FRANCHISE_DOCUMENT_TYPE_MESSAGES.FETCHED,
            data: type,
        });
    });

    public getPaginatedFranchiseDocumentTypes = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const authReq = req as IAuthenticatedRequest;
        const tenantUid = authReq.tenantUid;

        const result = await this.service.getPaginatedFranchiseDocumentTypes(tenantUid, req.body);
        res.status(200).json({
            success: true,
            message: FRANCHISE_DOCUMENT_TYPE_MESSAGES.LIST_FETCHED,
            data: result.data,
            meta: {
                total: result.total,
                page: req.body.page || 1,
                limit: req.body.limit || 10,
                totalPages: result.totalPages,
            },
        });
    });

    public getAllFranchiseDocumentTypes = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const authReq = req as IAuthenticatedRequest;
        const tenantUid = authReq.tenantUid;
        const status = req.query.status as string;

        const types = await this.service.getAllFranchiseDocumentTypes(tenantUid, status);
        res.status(200).json({
            success: true,
            message: FRANCHISE_DOCUMENT_TYPE_MESSAGES.LIST_FETCHED,
            data: types,
        });
    });

    public getDropdownTypes = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const authReq = req as IAuthenticatedRequest;
        const tenantUid = authReq.tenantUid;

        const types = await this.service.getDropdownTypes(tenantUid);
        res.status(200).json({
            success: true,
            message: FRANCHISE_DOCUMENT_TYPE_MESSAGES.LIST_FETCHED,
            data: types,
        });
    });

    public updateFranchiseDocumentType = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const authReq = req as IAuthenticatedRequest;
        const tenantUid = authReq.tenantUid;
        const uid = req.params.uid as string;
        const updatedBy = authReq.user.uid;

        const type = await this.service.updateFranchiseDocumentType(tenantUid, uid, req.body, updatedBy);
        res.status(200).json({
            success: true,
            message: FRANCHISE_DOCUMENT_TYPE_MESSAGES.UPDATED,
            data: type,
        });
    });

    public deleteFranchiseDocumentType = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const authReq = req as IAuthenticatedRequest;
        const tenantUid = authReq.tenantUid;
        const uid = req.params.uid as string;
        const deletedBy = authReq.user.uid;

        await this.service.deleteFranchiseDocumentType(tenantUid, uid, deletedBy);
        res.status(200).json({
            success: true,
            message: FRANCHISE_DOCUMENT_TYPE_MESSAGES.DELETED,
            data: null,
        });
    });

    public restoreFranchiseDocumentType = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const authReq = req as IAuthenticatedRequest;
        const tenantUid = authReq.tenantUid;
        const uid = req.params.uid as string;
        const updatedBy = authReq.user.uid;

        await this.service.restoreFranchiseDocumentType(tenantUid, uid, updatedBy);
        res.status(200).json({
            success: true,
            message: FRANCHISE_DOCUMENT_TYPE_MESSAGES.RESTORED,
            data: null,
        });
    });
}

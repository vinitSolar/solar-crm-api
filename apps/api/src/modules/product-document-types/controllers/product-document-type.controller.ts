import type { Request, Response } from "express";
import { asyncHandler } from "../../../utils/async-handler.js";
import type { ProductDocumentTypeService } from "../services/product-document-type.service.js";
import type { IAuthenticatedRequest } from "../../auth/interfaces/auth.interface.js";

export class ProductDocumentTypeController {
    private readonly service: ProductDocumentTypeService;

    constructor(service: ProductDocumentTypeService) {
        this.service = service;
    }

    public createProductDocumentType = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const authReq = req as IAuthenticatedRequest;
        const tenantUid = authReq.tenantUid;
        const createdBy = authReq.user.uid;

        const type = await this.service.createProductDocumentType(tenantUid, req.body, createdBy);
        res.status(201).json({
            success: true,
            message: "Product document type created successfully",
            data: type,
        });
    });

    public getProductDocumentTypeByUid = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const authReq = req as IAuthenticatedRequest;
        const tenantUid = authReq.tenantUid;
        const uid = req.params.uid as string;

        const type = await this.service.getProductDocumentTypeByUid(tenantUid, uid);
        res.status(200).json({
            success: true,
            message: "Product document type fetched successfully",
            data: type,
        });
    });

    public getPaginatedProductDocumentTypes = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const authReq = req as IAuthenticatedRequest;
        const tenantUid = authReq.tenantUid;

        const result = await this.service.getPaginatedProductDocumentTypes(tenantUid, req.body);
        res.status(200).json({
            success: true,
            message: "Product document types fetched successfully",
            data: result.data,
            meta: {
                total: result.total,
                page: req.body.page || 1,
                limit: req.body.limit || 10,
                totalPages: result.totalPages,
            },
        });
    });

    public getAllProductDocumentTypes = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const authReq = req as IAuthenticatedRequest;
        const tenantUid = authReq.tenantUid;
        const status = req.query.status as string;

        const types = await this.service.getAllProductDocumentTypes(tenantUid, status);
        res.status(200).json({
            success: true,
            message: "Product document types fetched successfully",
            data: types,
        });
    });

    public getDropdownTypes = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const authReq = req as IAuthenticatedRequest;
        const tenantUid = authReq.tenantUid;

        const types = await this.service.getDropdownTypes(tenantUid);
        res.status(200).json({
            success: true,
            message: "Product document types fetched successfully",
            data: types,
        });
    });

    public updateProductDocumentType = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const authReq = req as IAuthenticatedRequest;
        const tenantUid = authReq.tenantUid;
        const uid = req.params.uid as string;
        const updatedBy = authReq.user.uid;

        const type = await this.service.updateProductDocumentType(tenantUid, uid, req.body, updatedBy);
        res.status(200).json({
            success: true,
            message: "Product document type updated successfully",
            data: type,
        });
    });

    public deleteProductDocumentType = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const authReq = req as IAuthenticatedRequest;
        const tenantUid = authReq.tenantUid;
        const uid = req.params.uid as string;
        const deletedBy = authReq.user.uid;

        await this.service.deleteProductDocumentType(tenantUid, uid, deletedBy);
        res.status(200).json({
            success: true,
            message: "Product document type deleted successfully",
            data: null,
        });
    });

    public restoreProductDocumentType = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const authReq = req as IAuthenticatedRequest;
        const tenantUid = authReq.tenantUid;
        const uid = req.params.uid as string;
        const updatedBy = authReq.user.uid;

        await this.service.restoreProductDocumentType(tenantUid, uid, updatedBy);
        res.status(200).json({
            success: true,
            message: "Product document type restored successfully",
            data: null,
        });
    });
}

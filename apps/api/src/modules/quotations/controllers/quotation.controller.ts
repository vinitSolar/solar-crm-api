import type { Request, Response } from "express";
import type { IAuthenticatedRequest } from "../../auth/interfaces/auth.interface.js";
import { asyncHandler } from "../../../utils/async-handler.js";
import { QuotationService } from "../services/quotation.service.js";
import { QUOTATION_MESSAGES } from "../constants/quotation.constants.js";

const quotationService = new QuotationService();

export const createQuotation = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as IAuthenticatedRequest;
    const tenantUid = authReq.user.tenantUid;
    const createdBy = authReq.user.uid;

    const result = await quotationService.create(tenantUid, req.body, createdBy);

    res.status(201).json({
        success: true,
        message: QUOTATION_MESSAGES.CREATED_SUCCESSFULLY,
        data: result,
    });
});

export const updateQuotation = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as IAuthenticatedRequest;
    const tenantUid = authReq.user.tenantUid;
    const uid = req.params.uid as string;
    const updatedBy = authReq.user.uid;

    const result = await quotationService.update(tenantUid, uid, req.body, updatedBy);

    res.status(200).json({
        success: true,
        message: QUOTATION_MESSAGES.UPDATED_SUCCESSFULLY,
        data: result,
    });
});

export const getQuotation = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as IAuthenticatedRequest;
    const tenantUid = authReq.user.tenantUid;
    const uid = req.params.uid as string;

    const result = await quotationService.getByUid(tenantUid, uid);

    res.status(200).json({
        success: true,
        message: QUOTATION_MESSAGES.RETRIEVED_SUCCESSFULLY,
        data: result,
    });
});

export const listQuotations = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as IAuthenticatedRequest;
    const tenantUid = authReq.user.tenantUid;
    const { page, limit, search, status } = req.body;

    const result = await quotationService.list(tenantUid, {
        page,
        limit,
        search,
        status
    });

    res.status(200).json({
        success: true,
        message: QUOTATION_MESSAGES.FETCHED_SUCCESSFULLY,
        ...result,
    });
});

export const getQuotationDropdown = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as IAuthenticatedRequest;
    const tenantUid = authReq.user.tenantUid;

    const result = await quotationService.getDropdown(tenantUid);

    res.status(200).json({
        success: true,
        message: QUOTATION_MESSAGES.FETCHED_SUCCESSFULLY,
        data: result,
    });
});

export const deleteQuotation = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as IAuthenticatedRequest;
    const tenantUid = authReq.user.tenantUid;
    const uid = req.params.uid as string;
    const deletedBy = authReq.user.uid;

    await quotationService.delete(tenantUid, uid, deletedBy);

    res.status(200).json({
        success: true,
        message: QUOTATION_MESSAGES.DELETED_SUCCESSFULLY,
        data: null,
    });
});

export const restoreQuotation = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as IAuthenticatedRequest;
    const tenantUid = authReq.user.tenantUid;
    const uid = req.params.uid as string;
    const updatedBy = authReq.user.uid;

    await quotationService.restore(tenantUid, uid, updatedBy);

    res.status(200).json({
        success: true,
        message: QUOTATION_MESSAGES.RESTORED_SUCCESSFULLY,
        data: null,
    });
});

export const convertQuotationToProject = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as IAuthenticatedRequest;
    const tenantUid = authReq.user.tenantUid;
    const uid = req.params.uid as string;
    const updatedBy = authReq.user.uid;

    const result = await quotationService.convertToProject(tenantUid, uid, updatedBy);

    res.status(200).json({
        success: true,
        message: QUOTATION_MESSAGES.CONVERTED_SUCCESSFULLY,
        data: result,
    });
});

export const generateQuotationPdf = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as IAuthenticatedRequest;
    const tenantUid = authReq.user.tenantUid;
    const uid = req.params.uid as string;
    const createdBy = authReq.user.uid;

    const { pdfUrl, pdfPath } = await quotationService.generatePdf(tenantUid, uid, createdBy);

    res.status(200).json({
        success: true,
        message: "Quotation PDF generated successfully.",
        data: {
            pdfUrl,
            pdfPath
        }
    });
});

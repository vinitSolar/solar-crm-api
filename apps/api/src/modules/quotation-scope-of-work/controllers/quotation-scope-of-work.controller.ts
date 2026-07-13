import type { Request, Response } from "express";
import type { IAuthenticatedRequest } from "../../auth/interfaces/auth.interface.js";
import { asyncHandler } from "../../../utils/async-handler.js";
import { QuotationScopeOfWorkService } from "../services/quotation-scope-of-work.service.js";
import { QUOTATION_SCOPE_OF_WORK_MESSAGES } from "../constants/quotation-scope-of-work.constants.js";

const quotationScopeOfWorkService = new QuotationScopeOfWorkService();

export const createQuotationScopeOfWork = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as IAuthenticatedRequest;
    const tenantUid = authReq.user.tenantUid;
    const createdBy = authReq.user.uid;

    const result = await quotationScopeOfWorkService.create(tenantUid, req.body, createdBy);

    res.status(201).json({
        success: true,
        message: QUOTATION_SCOPE_OF_WORK_MESSAGES.CREATED_SUCCESSFULLY,
        data: result,
    });
});

export const updateQuotationScopeOfWork = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as IAuthenticatedRequest;
    const tenantUid = authReq.user.tenantUid;
    const uid = req.params.uid as string;
    const updatedBy = authReq.user.uid;

    const result = await quotationScopeOfWorkService.update(tenantUid, uid, req.body, updatedBy);

    res.status(200).json({
        success: true,
        message: QUOTATION_SCOPE_OF_WORK_MESSAGES.UPDATED_SUCCESSFULLY,
        data: result,
    });
});

export const getQuotationScopeOfWork = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as IAuthenticatedRequest;
    const tenantUid = authReq.user.tenantUid;
    const uid = req.params.uid as string;

    const result = await quotationScopeOfWorkService.getByUid(tenantUid, uid);

    res.status(200).json({
        success: true,
        message: QUOTATION_SCOPE_OF_WORK_MESSAGES.RETRIEVED_SUCCESSFULLY,
        data: result,
    });
});

export const listQuotationScopeOfWork = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as IAuthenticatedRequest;
    const tenantUid = authReq.user.tenantUid;
    const { page, limit, search, status, sortBy, sortDir } = req.body;

    const result = await quotationScopeOfWorkService.list(
        tenantUid,
        page,
        limit,
        search,
        status,
        sortBy,
        sortDir
    );

    res.status(200).json({
        success: true,
        message: QUOTATION_SCOPE_OF_WORK_MESSAGES.FETCHED_SUCCESSFULLY,
        ...result,
    });
});

export const getAllQuotationScopeOfWorks = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as IAuthenticatedRequest;
    const tenantUid = authReq.user.tenantUid;

    const result = await quotationScopeOfWorkService.getAll(tenantUid);

    res.status(200).json({
        success: true,
        message: QUOTATION_SCOPE_OF_WORK_MESSAGES.FETCHED_SUCCESSFULLY,
        data: result,
    });
});

export const getQuotationScopeOfWorkDropdown = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as IAuthenticatedRequest;
    const tenantUid = authReq.user.tenantUid;

    const result = await quotationScopeOfWorkService.getDropdown(tenantUid);

    res.status(200).json({
        success: true,
        message: QUOTATION_SCOPE_OF_WORK_MESSAGES.DROPDOWN_FETCHED_SUCCESSFULLY,
        data: result,
    });
});

export const deleteQuotationScopeOfWork = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as IAuthenticatedRequest;
    const tenantUid = authReq.user.tenantUid;
    const uid = req.params.uid as string;
    const deletedBy = authReq.user.uid;

    await quotationScopeOfWorkService.delete(tenantUid, uid, deletedBy);

    res.status(200).json({
        success: true,
        message: QUOTATION_SCOPE_OF_WORK_MESSAGES.DELETED_SUCCESSFULLY,
        data: null,
    });
});

export const restoreQuotationScopeOfWork = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as IAuthenticatedRequest;
    const tenantUid = authReq.user.tenantUid;
    const uid = req.params.uid as string;
    const updatedBy = authReq.user.uid;

    await quotationScopeOfWorkService.restore(tenantUid, uid, updatedBy);

    res.status(200).json({
        success: true,
        message: QUOTATION_SCOPE_OF_WORK_MESSAGES.RESTORED_SUCCESSFULLY,
        data: null,
    });
});

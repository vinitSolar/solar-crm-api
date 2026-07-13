import type { Request, Response } from "express";
import type { IAuthenticatedRequest } from "../../auth/interfaces/auth.interface.js";
import { asyncHandler } from "../../../utils/async-handler.js";
import { QuotationTermsConditionService } from "../services/quotation-terms-condition.service.js";
import { QUOTATION_TERMS_CONDITION_MESSAGES } from "../constants/quotation-terms-condition.constants.js";

const quotationTermsConditionService = new QuotationTermsConditionService();

export const createQuotationTermsCondition = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as IAuthenticatedRequest;
    const tenantUid = authReq.user.tenantUid;
    const createdBy = authReq.user.uid;

    const result = await quotationTermsConditionService.create(tenantUid, req.body, createdBy);

    res.status(201).json({
        success: true,
        message: QUOTATION_TERMS_CONDITION_MESSAGES.CREATED_SUCCESSFULLY,
        data: result,
    });
});

export const updateQuotationTermsCondition = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as IAuthenticatedRequest;
    const tenantUid = authReq.user.tenantUid;
    const uid = req.params.uid as string;
    const updatedBy = authReq.user.uid;

    const result = await quotationTermsConditionService.update(tenantUid, uid, req.body, updatedBy);

    res.status(200).json({
        success: true,
        message: QUOTATION_TERMS_CONDITION_MESSAGES.UPDATED_SUCCESSFULLY,
        data: result,
    });
});

export const getQuotationTermsCondition = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as IAuthenticatedRequest;
    const tenantUid = authReq.user.tenantUid;
    const uid = req.params.uid as string;

    const result = await quotationTermsConditionService.getByUid(tenantUid, uid);

    res.status(200).json({
        success: true,
        message: QUOTATION_TERMS_CONDITION_MESSAGES.RETRIEVED_SUCCESSFULLY,
        data: result,
    });
});

export const listQuotationTermsCondition = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as IAuthenticatedRequest;
    const tenantUid = authReq.user.tenantUid;
    const { page, limit, search, status, sortBy, sortDir } = req.body;

    const result = await quotationTermsConditionService.list(
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
        message: QUOTATION_TERMS_CONDITION_MESSAGES.FETCHED_SUCCESSFULLY,
        ...result,
    });
});

export const getAllQuotationTermsConditions = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as IAuthenticatedRequest;
    const tenantUid = authReq.user.tenantUid;

    const result = await quotationTermsConditionService.getAll(tenantUid);

    res.status(200).json({
        success: true,
        message: QUOTATION_TERMS_CONDITION_MESSAGES.FETCHED_SUCCESSFULLY,
        data: result,
    });
});

export const getQuotationTermsConditionDropdown = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as IAuthenticatedRequest;
    const tenantUid = authReq.user.tenantUid;

    const result = await quotationTermsConditionService.getDropdown(tenantUid);

    res.status(200).json({
        success: true,
        message: QUOTATION_TERMS_CONDITION_MESSAGES.DROPDOWN_FETCHED_SUCCESSFULLY,
        data: result,
    });
});

export const deleteQuotationTermsCondition = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as IAuthenticatedRequest;
    const tenantUid = authReq.user.tenantUid;
    const uid = req.params.uid as string;
    const deletedBy = authReq.user.uid;

    await quotationTermsConditionService.delete(tenantUid, uid, deletedBy);

    res.status(200).json({
        success: true,
        message: QUOTATION_TERMS_CONDITION_MESSAGES.DELETED_SUCCESSFULLY,
        data: null,
    });
});

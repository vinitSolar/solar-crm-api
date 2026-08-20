import type { Request, Response, NextFunction } from "express";
import { BankDetailService } from "../services/bank-detail.service.js";
import { asyncHandler } from "../../../utils/async-handler.js";
import { CustomError } from "../../../middlewares/error.middleware.js";

export class BankDetailController {
    private readonly service: BankDetailService;

    constructor(service: BankDetailService) {
        this.service = service;
    }

    create = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const tenantUid = (req as any).user?.tenantUid;
        const createdBy = (req as any).user?.uid;

        if (!tenantUid) {
            throw new CustomError("Unauthorized", 401);
        }

        const bankDetail = await this.service.createBankDetail(tenantUid, req.body, createdBy);

        res.status(201).json({
            success: true,
            message: "Bank details created successfully",
            data: bankDetail,
        });
    });

    getDefault = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const tenantUid = (req as any).user?.tenantUid;

        if (!tenantUid) {
            throw new CustomError("Unauthorized", 401);
        }

        const bankDetail = await this.service.getDefaultBankDetail(tenantUid);

        res.status(200).json({
            success: true,
            message: "Bank details fetched successfully",
            data: bankDetail,
        });
    });

    getAll = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const tenantUid = (req as any).user?.tenantUid;

        if (!tenantUid) {
            throw new CustomError("Unauthorized", 401);
        }

        const bankDetails = await this.service.getAllBankDetails(tenantUid);

        res.status(200).json({
            success: true,
            message: "Bank details fetched successfully",
            data: bankDetails,
        });
    });

    update = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const tenantUid = (req as any).user?.tenantUid;
        const updatedBy = (req as any).user?.uid;
        const { uid } = req.params;

        if (!tenantUid) {
            throw new CustomError("Unauthorized", 401);
        }

        const updated = await this.service.updateBankDetail(uid as string, tenantUid, req.body, updatedBy);

        if (!updated) {
            throw new CustomError("Bank details not found", 404);
        }

        res.status(200).json({
            success: true,
            message: "Bank details updated successfully",
            data: updated,
        });
    });

    delete = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const tenantUid = (req as any).user?.tenantUid;
        const deletedBy = (req as any).user?.uid;
        const { uid } = req.params;

        if (!tenantUid) {
            throw new CustomError("Unauthorized", 401);
        }

        const deleted = await this.service.deleteBankDetail(uid as string, tenantUid, deletedBy);

        if (!deleted) {
            throw new CustomError("Bank details not found", 404);
        }

        res.status(200).json({
            success: true,
            message: "Bank details deleted successfully",
            data: null,
        });
    });
}

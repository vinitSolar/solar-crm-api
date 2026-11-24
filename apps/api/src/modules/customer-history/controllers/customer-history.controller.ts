import type { Request, Response, NextFunction } from "express";
import { CustomerHistoryService } from "../services/customer-history.service.js";
import type { IAuthenticatedRequest } from "../../auth/interfaces/auth.interface.js";

export class CustomerHistoryController {
    private readonly service: CustomerHistoryService;

    constructor(service: CustomerHistoryService) {
        this.service = service;
    }

    getByLeadUid = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const { leadUid } = req.params;

            const history = await this.service.getHistoryByLeadUid(tenantUid, leadUid as string);

            res.status(200).json({
                success: true,
                message: history ? "Customer history retrieved successfully" : "No history found for this lead",
                data: history || null
            });
        } catch (error) {
            next(error);
        }
    };

    getByUid = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const { uid } = req.params;

            const history = await this.service.getHistoryByUid(tenantUid, uid as string);

            res.status(200).json({
                success: true,
                message: history ? "Customer history retrieved successfully" : "Customer history not found",
                data: history || null
            });
        } catch (error) {
            next(error);
        }
    };

    getPaginated = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
            const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string, 10) || 10));
            const search = req.query.search ? String(req.query.search) : undefined;
            const isClosed = req.query.isClosed !== undefined ? parseInt(req.query.isClosed as string, 10) : undefined;

            const result = await this.service.getPaginatedHistories(tenantUid, page, limit, {
                search,
                isClosed
            });

            res.status(200).json({
                success: true,
                message: "Customer histories retrieved successfully",
                data: result.data,
                meta: {
                    total: result.total,
                    page: result.page,
                    limit: result.limit,
                    totalPages: Math.ceil(result.total / result.limit)
                }
            });
        } catch (error) {
            next(error);
        }
    };
}

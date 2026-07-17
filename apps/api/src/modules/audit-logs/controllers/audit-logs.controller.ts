import type { Request, Response } from "express";
import { AuditLogService } from "../services/audit-logs.service.js";
import { AUDIT_LOG_MESSAGES } from "../constants/audit-logs.constants.js";
import { asyncHandler } from "../../../utils/async-handler.js";

export class AuditLogController {
    private service: AuditLogService;

    constructor(service: AuditLogService) {
        this.service = service;
    }

    /**
     * Get paginated audit logs
     */
    public getLogs = asyncHandler(async (req: Request, res: Response) => {
        const { page, limit, search, filters } = req.body;

        const result = await this.service.getLogs({
            page,
            limit,
            search,
            filters
        });

        const totalPages = Math.ceil(result.total / (limit || 10));

        res.status(200).json({
            success: true,
            message: AUDIT_LOG_MESSAGES.FETCH_SUCCESS,
            data: result.logs,
            meta: {
                total: result.total,
                page: page || 1,
                limit: limit || 10,
                totalPages
            }
        });
    });
}

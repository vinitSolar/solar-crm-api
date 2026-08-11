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

}

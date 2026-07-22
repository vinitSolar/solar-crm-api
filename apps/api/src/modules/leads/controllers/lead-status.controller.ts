import type { Request, Response, NextFunction } from "express";
import type { LeadStatusService } from "../services/lead-status.service.js";
import { LEAD_STATUS_MESSAGES } from "../constants/lead.constants.js";
import type { IAuthenticatedRequest } from "../../auth/interfaces/auth.interface.js";

export class LeadStatusController {
    private readonly service: LeadStatusService;

    constructor(service: LeadStatusService) {
        this.service = service;
    }

    createLeadStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const userUid = authReq.user.uid;

            const leadStatus = await this.service.createLeadStatus(tenantUid, req.body, userUid);
            res.status(201).json({
                success: true,
                message: LEAD_STATUS_MESSAGES.CREATED,
                data: leadStatus,
            });
        } catch (error) {
            next(error);
        }
    };

    getLeadStatusByUid = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const uid = req.params.uid as string;

            const leadStatus = await this.service.getLeadStatusByUid(tenantUid, uid);
            res.status(200).json({
                success: true,
                message: LEAD_STATUS_MESSAGES.FETCHED_SUCCESSFULLY,
                data: leadStatus,
            });
        } catch (error) {
            next(error);
        }
    };

    getAllLeadStatuses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const status = (req.query.status as "active" | "deleted" | "all") || "active";

            const leadStatuses = await this.service.getAllLeadStatuses(tenantUid, status);
            const dataWithoutIsClosed = leadStatuses.map(({ isClosed, ...rest }) => rest);
            res.status(200).json({
                success: true,
                message: LEAD_STATUS_MESSAGES.FETCHED_SUCCESSFULLY,
                data: dataWithoutIsClosed,
            });
        } catch (error) {
            next(error);
        }
    };

    updateLeadStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const userUid = authReq.user.uid;
            const uid = req.params.uid as string;

            const leadStatus = await this.service.updateLeadStatus(tenantUid, uid, req.body, userUid);
            res.status(200).json({
                success: true,
                message: LEAD_STATUS_MESSAGES.UPDATED,
                data: leadStatus,
            });
        } catch (error) {
            next(error);
        }
    };

    deleteLeadStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const userUid = authReq.user.uid;
            const uid = req.params.uid as string;

            await this.service.deleteLeadStatus(tenantUid, uid, userUid);
            res.status(200).json({
                success: true,
                message: LEAD_STATUS_MESSAGES.DELETED,
                data: {},
            });
        } catch (error) {
            next(error);
        }
    };

    restoreLeadStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const userUid = authReq.user.uid;
            const uid = req.params.uid as string;

            await this.service.restoreLeadStatus(tenantUid, uid, userUid);
            res.status(200).json({
                success: true,
                message: LEAD_STATUS_MESSAGES.RESTORED,
                data: {},
            });
        } catch (error) {
            next(error);
        }
    };
}

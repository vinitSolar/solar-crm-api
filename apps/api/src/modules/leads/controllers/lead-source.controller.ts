import type { Request, Response, NextFunction } from "express";
import type { LeadSourceService } from "../services/lead-source.service.js";
import { LEAD_SOURCE_MESSAGES } from "../constants/lead.constants.js";
import type { IAuthenticatedRequest } from "../../auth/interfaces/auth.interface.js";

export class LeadSourceController {
    private readonly service: LeadSourceService;

    constructor(service: LeadSourceService) {
        this.service = service;
    }

    createLeadSource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const userUid = authReq.user.uid;

            const leadSource = await this.service.createLeadSource(tenantUid, req.body, userUid);
            res.status(201).json({
                success: true,
                message: LEAD_SOURCE_MESSAGES.CREATED,
                data: leadSource,
            });
        } catch (error) {
            next(error);
        }
    };

    getLeadSourceByUid = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const uid = req.params.uid as string;

            const leadSource = await this.service.getLeadSourceByUid(tenantUid, uid);
            res.status(200).json({
                success: true,
                message: LEAD_SOURCE_MESSAGES.FETCHED_SUCCESSFULLY,
                data: leadSource,
            });
        } catch (error) {
            next(error);
        }
    };

    getAllLeadSources = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const status = (req.query.status as "active" | "deleted" | "all") || "active";

            const leadSources = await this.service.getAllLeadSources(tenantUid, status);
            res.status(200).json({
                success: true,
                message: LEAD_SOURCE_MESSAGES.FETCHED_SUCCESSFULLY,
                data: leadSources,
            });
        } catch (error) {
            next(error);
        }
    };

    updateLeadSource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const userUid = authReq.user.uid;
            const uid = req.params.uid as string;

            const leadSource = await this.service.updateLeadSource(tenantUid, uid, req.body, userUid);
            res.status(200).json({
                success: true,
                message: LEAD_SOURCE_MESSAGES.UPDATED,
                data: leadSource,
            });
        } catch (error) {
            next(error);
        }
    };

    deleteLeadSource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const userUid = authReq.user.uid;
            const uid = req.params.uid as string;

            await this.service.deleteLeadSource(tenantUid, uid, userUid);
            res.status(200).json({
                success: true,
                message: LEAD_SOURCE_MESSAGES.DELETED,
                data: {},
            });
        } catch (error) {
            next(error);
        }
    };

    restoreLeadSource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const userUid = authReq.user.uid;
            const uid = req.params.uid as string;

            await this.service.restoreLeadSource(tenantUid, uid, userUid);
            res.status(200).json({
                success: true,
                message: LEAD_SOURCE_MESSAGES.RESTORED,
                data: {},
            });
        } catch (error) {
            next(error);
        }
    };
}

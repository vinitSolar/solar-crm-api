import type { Request, Response, NextFunction } from "express";
import type { LeadService } from "../services/lead.service.js";
import { LEAD_MESSAGES } from "../constants/lead.constants.js";
import type { IAuthenticatedRequest } from "../../auth/interfaces/auth.interface.js";

export class LeadController {
    private readonly service: LeadService;

    constructor(service: LeadService) {
        this.service = service;
    }

    createLead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const userUid = authReq.user.uid;

            const lead = await this.service.createLead(tenantUid, req.body, userUid);
            res.status(201).json({
                success: true,
                message: LEAD_MESSAGES.CREATED,
                data: lead,
            });
        } catch (error) {
            next(error);
        }
    };

    getLeadByUid = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const uid = req.params.uid as string;

            const lead = await this.service.getLeadByUid(tenantUid, uid);
            res.status(200).json({
                success: true,
                message: LEAD_MESSAGES.FETCHED_SUCCESSFULLY,
                data: lead,
            });
        } catch (error) {
            next(error);
        }
    };

    getLeadsPaginated = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const query = req.body;

            const leads = await this.service.getLeadsPaginated(tenantUid, query);
            res.status(200).json({
                success: true,
                message: LEAD_MESSAGES.FETCHED_SUCCESSFULLY,
                data: leads.data,
                meta: leads.meta,
            });
        } catch (error) {
            next(error);
        }
    };

    getAllLeads = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const status = req.query.status as "active" | "deleted" | "all" | undefined;

            const leads = await this.service.getAllLeads(tenantUid, status);
            res.status(200).json({
                success: true,
                message: LEAD_MESSAGES.FETCHED_SUCCESSFULLY,
                data: leads,
            });
        } catch (error) {
            next(error);
        }
    };

    updateLead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const userUid = authReq.user.uid;
            const uid = req.params.uid as string;

            const lead = await this.service.updateLead(tenantUid, uid, req.body, userUid);
            res.status(200).json({
                success: true,
                message: LEAD_MESSAGES.UPDATED,
                data: lead,
            });
        } catch (error) {
            next(error);
        }
    };

    deleteLead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const userUid = authReq.user.uid;
            const uid = req.params.uid as string;

            await this.service.deleteLead(tenantUid, uid, userUid);
            res.status(200).json({
                success: true,
                message: LEAD_MESSAGES.DELETED,
                data: {},
            });
        } catch (error) {
            next(error);
        }
    };

    restoreLead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const userUid = authReq.user.uid;
            const uid = req.params.uid as string;

            await this.service.restoreLead(tenantUid, uid, userUid);
            res.status(200).json({
                success: true,
                message: LEAD_MESSAGES.RESTORED,
                data: {},
            });
        } catch (error) {
            next(error);
        }
    };
}

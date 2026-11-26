import type { Request, Response, NextFunction } from "express";
import pool from "@packages/connection.js";
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
            const includeDeleted = req.query.includeDeleted === "true" || req.query.includeDeleted === "1";

            const lead = await this.service.getLeadByUid(tenantUid, uid, includeDeleted);
            res.status(200).json({
                success: true,
                message: LEAD_MESSAGES.FETCHED_SUCCESSFULLY,
                data: lead,
            });
        } catch (error) {
            next(error);
        }
    };

    
    getLeadsCursor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const userUid = authReq.user.uid;
            const roleUid = authReq.roleUid || authReq.user.roleUid;
            const query = req.query as any;

            const result = await this.service.getLeadsCursor(tenantUid, userUid, roleUid, query);
            res.status(200).json({
                success: true,
                message: LEAD_MESSAGES.FETCHED_SUCCESSFULLY,
                data: result.data,
                pagination: result.pagination,
            });
        } catch (error) {
            next(error);
        }
    };

    getLeadsPaginated = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const userUid = authReq.user.uid;
            const roleUid = authReq.roleUid || authReq.user.roleUid;
            const query = req.body;

            const leads = await this.service.getLeadsPaginated(tenantUid, userUid, roleUid, query);
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
            const userUid = authReq.user.uid;
            const roleUid = authReq.roleUid || authReq.user.roleUid;
            const status = req.query.status as "active" | "deleted" | "all" | undefined;

            const leads = await this.service.getAllLeads(tenantUid, userUid, roleUid, status);
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

    changeStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const userUid = authReq.user.uid;
            const uid = req.params.uid as string;
            const { statusUid } = req.body;

            const lead = await this.service.changeLeadStatus(tenantUid, uid, statusUid, userUid);
            res.status(200).json({
                success: true,
                message: LEAD_MESSAGES.UPDATED,
                data: lead,
            });
        } catch (error) {
            next(error);
        }
    };

    archiveLead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const userUid = authReq.user.uid;
            const uid = req.params.uid as string;

            await this.service.archiveLead(tenantUid, uid, userUid);
            res.status(200).json({
                success: true,
                message: "Lead archived successfully",
                data: {},
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
            const isPermanent = req.query.permanent === "true" || req.query.permanent === "1" || req.query.hard === "true";

            if (isPermanent) {
                // Feature permission check for permanent delete
                const featureRes = await pool.query(
                    `SELECT COALESCE(ufp.is_enabled, rfp.is_enabled, 0) AS is_enabled
                     FROM features f
                     LEFT JOIN role_feature_permissions rfp ON f.uid = rfp.feature_uid AND rfp.role_uid = $1 AND rfp.tenant_uid = $3
                     LEFT JOIN user_feature_permissions ufp ON f.uid = ufp.feature_uid AND ufp.user_uid = $2 AND ufp.tenant_uid = $3
                     WHERE LOWER(f.code) = 'lead_delete' AND f.is_active = 1`,
                    [authReq.roleUid, userUid, tenantUid]
                );
                if (featureRes.rows.length === 0 || featureRes.rows[0].is_enabled !== 1) {
                    res.status(403).json({
                        success: false,
                        message: "Forbidden: You do not have permission for feature 'lead_delete'",
                    });
                    return;
                }

                await this.service.hardDeleteLead(tenantUid, uid);
                res.status(200).json({
                    success: true,
                    message: "Lead and all connected data deleted permanently",
                    data: {},
                });
            } else {
                await this.service.deleteLead(tenantUid, uid, userUid);
                res.status(200).json({
                    success: true,
                    message: LEAD_MESSAGES.DELETED,
                    data: {},
                });
            }
        } catch (error) {
            next(error);
        }
    };

    hardDeleteLead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const uid = req.params.uid as string;

            await this.service.hardDeleteLead(tenantUid, uid);
            res.status(200).json({
                success: true,
                message: "Lead and all connected data deleted permanently",
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

    checkDuplicate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const { mobileNumber, email, excludeUid } = req.body;

            const result = await this.service.checkDuplicateLead(tenantUid, {
                mobileNumber,
                email,
                excludeUid,
            });

            res.status(200).json({
                success: true,
                message: "Duplicate check completed",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    getFollowUps = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const leadUid = (req.params.leadUid || req.params.uid) as string;

            const followUps = await this.service.getFollowUps(tenantUid, leadUid);
            res.status(200).json({
                success: true,
                message: "Follow-ups fetched successfully",
                data: followUps,
            });
        } catch (error) {
            next(error);
        }
    };

    scheduleFollowUp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const userUid = authReq.user.uid;
            const leadUid = (req.params.leadUid || req.params.uid) as string;

            const followUp = await this.service.scheduleFollowUp(tenantUid, leadUid, req.body, userUid);
            res.status(201).json({
                success: true,
                message: "Follow-up scheduled successfully",
                data: followUp,
            });
        } catch (error) {
            next(error);
        }
    };

    completeFollowUp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const userUid = authReq.user.uid;
            const leadUid = (req.params.leadUid || req.params.uid) as string;
            const notes = req.body.notes;

            const completed = await this.service.completeFollowUp(tenantUid, leadUid, notes, userUid);
            res.status(200).json({
                success: true,
                message: "Follow-up completed successfully",
                data: completed,
            });
        } catch (error) {
            next(error);
        }
    };

    getActiveFollowUps = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const userUid = authReq.user.uid;
            const roleUid = authReq.user.roleUid;
            const assignedTo = req.query.assignedTo as string | undefined;

            const followUps = await this.service.getActiveFollowUps(tenantUid, userUid, roleUid, assignedTo);
            res.status(200).json({
                success: true,
                message: "Active follow-ups fetched successfully",
                data: followUps,
            });
        } catch (error) {
            next(error);
        }
    };

    checkScheduleConflict = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const followUpDate = req.query.followUpDate as string | undefined;
            const excludeLeadUid = req.query.excludeLeadUid as string | undefined;
            const assignedTo = (req.query.assignedTo as string | undefined) || (req.query.userId as string | undefined);

            if (!followUpDate) {
                res.status(400).json({
                    success: false,
                    message: "followUpDate query parameter is required",
                });
                return;
            }

            const conflict = await this.service.checkScheduleConflict(tenantUid, followUpDate, excludeLeadUid || null, assignedTo || null);
            res.status(200).json({
                success: true,
                message: conflict ? "Schedule conflict detected" : "Time slot is available",
                data: {
                    hasConflict: Boolean(conflict),
                    conflict: conflict || null,
                },
            });
        } catch (error) {
            next(error);
        }
    };
}

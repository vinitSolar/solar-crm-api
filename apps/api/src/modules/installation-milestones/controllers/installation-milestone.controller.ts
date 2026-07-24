import type { Request, Response, NextFunction } from "express";
import type { InstallationMilestoneService } from "../services/installation-milestone.service.js";
import { INSTALLATION_MILESTONE_MESSAGES } from "../constants/installation-milestone.constants.js";
import type { IAuthenticatedRequest } from "../../auth/interfaces/auth.interface.js";

export class InstallationMilestoneController {
    private readonly service: InstallationMilestoneService;

    constructor(service: InstallationMilestoneService) {
        this.service = service;
    }

    createInstallationMilestone = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const userUid = authReq.user.uid;

            const milestone = await this.service.createInstallationMilestone(tenantUid, req.body, userUid);
            res.status(201).json({
                success: true,
                message: INSTALLATION_MILESTONE_MESSAGES.CREATED,
                data: milestone,
            });
        } catch (error) {
            next(error);
        }
    };

    getInstallationMilestoneByUid = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const uid = req.params.uid as string;

            const milestone = await this.service.getInstallationMilestoneByUid(tenantUid, uid);
            res.status(200).json({
                success: true,
                message: INSTALLATION_MILESTONE_MESSAGES.FETCHED_SUCCESSFULLY,
                data: milestone,
            });
        } catch (error) {
            next(error);
        }
    };

    getAllInstallationMilestones = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const status = (req.query.status as "active" | "deleted" | "all") || "active";

            const milestones = await this.service.getAllInstallationMilestones(tenantUid, status);
            res.status(200).json({
                success: true,
                message: INSTALLATION_MILESTONE_MESSAGES.FETCHED_SUCCESSFULLY,
                data: milestones,
            });
        } catch (error) {
            next(error);
        }
    };

    updateInstallationMilestone = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const userUid = authReq.user.uid;
            const uid = req.params.uid as string;

            const milestone = await this.service.updateInstallationMilestone(tenantUid, uid, req.body, userUid);
            res.status(200).json({
                success: true,
                message: INSTALLATION_MILESTONE_MESSAGES.UPDATED,
                data: milestone,
            });
        } catch (error) {
            next(error);
        }
    };

    deleteInstallationMilestone = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const userUid = authReq.user.uid;
            const uid = req.params.uid as string;

            await this.service.deleteInstallationMilestone(tenantUid, uid, userUid);
            res.status(200).json({
                success: true,
                message: INSTALLATION_MILESTONE_MESSAGES.DELETED,
                data: {},
            });
        } catch (error) {
            next(error);
        }
    };

    restoreInstallationMilestone = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const userUid = authReq.user.uid;
            const uid = req.params.uid as string;

            await this.service.restoreInstallationMilestone(tenantUid, uid, userUid);
            res.status(200).json({
                success: true,
                message: INSTALLATION_MILESTONE_MESSAGES.RESTORED,
                data: {},
            });
        } catch (error) {
            next(error);
        }
    };
}

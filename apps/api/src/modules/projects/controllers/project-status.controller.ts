import type { Request, Response, NextFunction } from "express";
import type { ProjectStatusService } from "../services/project-status.service.js";
import { PROJECT_STATUS_MESSAGES } from "../constants/project.constants.js";
import type { IAuthenticatedRequest } from "../../auth/interfaces/auth.interface.js";

export class ProjectStatusController {
    private readonly service: ProjectStatusService;

    constructor(service: ProjectStatusService) {
        this.service = service;
    }

    createProjectStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const userUid = authReq.user.uid;

            const projectStatus = await this.service.createProjectStatus(tenantUid, req.body, userUid);
            res.status(201).json({
                success: true,
                message: PROJECT_STATUS_MESSAGES.CREATED,
                data: projectStatus,
            });
        } catch (error) {
            next(error);
        }
    };

    getProjectStatusByUid = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const uid = req.params.uid as string;

            const projectStatus = await this.service.getProjectStatusByUid(tenantUid, uid);
            res.status(200).json({
                success: true,
                message: PROJECT_STATUS_MESSAGES.FETCHED_SUCCESSFULLY,
                data: projectStatus,
            });
        } catch (error) {
            next(error);
        }
    };

    getAllProjectStatuses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const status = (req.query.status as "active" | "deleted" | "all") || "active";

            const projectStatuses = await this.service.getAllProjectStatuses(tenantUid, status);
            res.status(200).json({
                success: true,
                message: PROJECT_STATUS_MESSAGES.FETCHED_SUCCESSFULLY,
                data: projectStatuses,
            });
        } catch (error) {
            next(error);
        }
    };

    updateProjectStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const userUid = authReq.user.uid;
            const uid = req.params.uid as string;

            const projectStatus = await this.service.updateProjectStatus(tenantUid, uid, req.body, userUid);
            res.status(200).json({
                success: true,
                message: PROJECT_STATUS_MESSAGES.UPDATED,
                data: projectStatus,
            });
        } catch (error) {
            next(error);
        }
    };

    deleteProjectStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const userUid = authReq.user.uid;
            const uid = req.params.uid as string;

            await this.service.deleteProjectStatus(tenantUid, uid, userUid);
            res.status(200).json({
                success: true,
                message: PROJECT_STATUS_MESSAGES.DELETED,
                data: {},
            });
        } catch (error) {
            next(error);
        }
    };

    restoreProjectStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const userUid = authReq.user.uid;
            const uid = req.params.uid as string;

            await this.service.restoreProjectStatus(tenantUid, uid, userUid);
            res.status(200).json({
                success: true,
                message: PROJECT_STATUS_MESSAGES.RESTORED,
                data: {},
            });
        } catch (error) {
            next(error);
        }
    };
}

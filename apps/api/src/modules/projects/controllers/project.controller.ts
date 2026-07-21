import type { Request, Response, NextFunction } from "express";
import type { ProjectService } from "../services/project.service.js";
import { PROJECT_MESSAGES } from "../constants/project.constants.js";
import type { IAuthenticatedRequest } from "../../auth/interfaces/auth.interface.js";

export class ProjectController {
    private readonly service: ProjectService;

    constructor(service: ProjectService) {
        this.service = service;
    }

    createProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const userUid = authReq.user.uid;
            const ipAddress = req.ip || "Unknown";
            const userAgent = req.headers["user-agent"] || "Unknown";

            const project = await this.service.createProject(tenantUid, req.body, userUid, ipAddress, userAgent);
            res.status(201).json({
                success: true,
                message: PROJECT_MESSAGES.CREATED,
                data: project,
            });
        } catch (error) {
            next(error);
        }
    };

    getProjectByUid = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const uid = req.params.uid as string;

            const project = await this.service.getProjectByUid(tenantUid, uid);
            res.status(200).json({
                success: true,
                message: PROJECT_MESSAGES.FETCHED_SUCCESSFULLY,
                data: project,
            });
        } catch (error) {
            next(error);
        }
    };

    getProjectsPaginated = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const query = req.body;

            const projects = await this.service.getProjectsPaginated(tenantUid, query);
            res.status(200).json({
                success: true,
                message: PROJECT_MESSAGES.FETCHED_SUCCESSFULLY,
                data: projects.data,
                meta: projects.meta,
            });
        } catch (error) {
            next(error);
        }
    };

    updateProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const userUid = authReq.user.uid;
            const uid = req.params.uid as string;
            const ipAddress = req.ip || "Unknown";
            const userAgent = req.headers["user-agent"] || "Unknown";

            const project = await this.service.updateProject(tenantUid, uid, req.body, userUid, ipAddress, userAgent);
            res.status(200).json({
                success: true,
                message: PROJECT_MESSAGES.UPDATED,
                data: project,
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
            const ipAddress = req.ip || "Unknown";
            const userAgent = req.headers["user-agent"] || "Unknown";

            const project = await this.service.changeProjectStatus(tenantUid, uid, statusUid, userUid, ipAddress, userAgent);
            res.status(200).json({
                success: true,
                message: PROJECT_MESSAGES.UPDATED,
                data: project,
            });
        } catch (error) {
            next(error);
        }
    };

    deleteProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const userUid = authReq.user.uid;
            const uid = req.params.uid as string;
            const ipAddress = req.ip || "Unknown";
            const userAgent = req.headers["user-agent"] || "Unknown";

            await this.service.deleteProject(tenantUid, uid, userUid, ipAddress, userAgent);
            res.status(200).json({
                success: true,
                message: PROJECT_MESSAGES.DELETED,
                data: {},
            });
        } catch (error) {
            next(error);
        }
    };

    restoreProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const userUid = authReq.user.uid;
            const uid = req.params.uid as string;
            const ipAddress = req.ip || "Unknown";
            const userAgent = req.headers["user-agent"] || "Unknown";

            await this.service.restoreProject(tenantUid, uid, userUid, ipAddress, userAgent);
            res.status(200).json({
                success: true,
                message: PROJECT_MESSAGES.RESTORED,
                data: {},
            });
        } catch (error) {
            next(error);
        }
    };
}

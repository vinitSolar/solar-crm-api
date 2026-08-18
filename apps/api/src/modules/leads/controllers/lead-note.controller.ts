import type { Request, Response, NextFunction } from "express";
import type { LeadNoteService } from "../services/lead-note.service.js";
import type { IAuthenticatedRequest } from "../../auth/interfaces/auth.interface.js";

export class LeadNoteController {
    private readonly service: LeadNoteService;

    constructor(service: LeadNoteService) {
        this.service = service;
    }

    createLeadNote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const userUid = authReq.user.uid;
            const leadUid = req.params.leadUid as string;
            
            const ipAddress = req.ip || req.socket.remoteAddress;
            const userAgent = req.headers["user-agent"];

            const note = await this.service.createLeadNote(tenantUid, leadUid, req.body, userUid, ipAddress, userAgent);
            res.status(201).json({
                success: true,
                message: "Lead note created successfully",
                data: note,
            });
        } catch (error) {
            next(error);
        }
    };

    updateLeadNote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const userUid = authReq.user.uid;
            const leadUid = req.params.leadUid as string;
            const uid = req.params.uid as string;

            const ipAddress = req.ip || req.socket.remoteAddress;
            const userAgent = req.headers["user-agent"];

            const note = await this.service.updateLeadNote(tenantUid, leadUid, uid, req.body, userUid, ipAddress, userAgent);
            res.status(200).json({
                success: true,
                message: "Lead note updated successfully",
                data: note,
            });
        } catch (error) {
            next(error);
        }
    };

    deleteLeadNote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const userUid = authReq.user.uid;
            const leadUid = req.params.leadUid as string;
            const uid = req.params.uid as string;

            const ipAddress = req.ip || req.socket.remoteAddress;
            const userAgent = req.headers["user-agent"];

            await this.service.deleteLeadNote(tenantUid, leadUid, uid, userUid, ipAddress, userAgent);
            res.status(200).json({
                success: true,
                message: "Lead note deleted successfully",
                data: null,
            });
        } catch (error) {
            next(error);
        }
    };

    getPaginated = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const leadUid = req.params.leadUid as string;
            
            const query = {
                ...req.body,
                leadUid
            };

            const notes = await this.service.getPaginated(tenantUid, query);
            res.status(200).json({
                success: true,
                message: "Lead notes fetched successfully",
                data: notes.data,
                meta: notes.meta,
            });
        } catch (error) {
            next(error);
        }
    };

    getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const leadUid = req.params.leadUid as string;

            const notes = await this.service.getAll(tenantUid, leadUid);
            res.status(200).json({
                success: true,
                message: "Lead notes fetched successfully",
                data: notes.data,
            });
        } catch (error) {
            next(error);
        }
    };
}

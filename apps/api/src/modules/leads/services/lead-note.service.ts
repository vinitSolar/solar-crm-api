import type { LeadNoteRepository } from "../repositories/lead-note.repository.js";
import type { ILeadNoteSafe, ICreateLeadNote, IUpdateLeadNote, ILeadNotePaginationQuery } from "../interfaces/lead-note.interface.js";
import { toLeadNoteSafe } from "../dto/lead-note.dto.js";
import { CustomError } from "../../../middlewares/error.middleware.js";
import { logger } from "@packages/logger/index.js";
import type { AuditLogService } from "../../audit-logs/services/audit-logs.service.js";
import { AUDIT_LOG_ACTIONS } from "../../audit-logs/constants/audit-logs.constants.js";

export class LeadNoteService {
    private readonly repository: LeadNoteRepository;
    private readonly auditLogService: AuditLogService;

    constructor(repository: LeadNoteRepository, auditLogService: AuditLogService) {
        this.repository = repository;
        this.auditLogService = auditLogService;
    }

    async createLeadNote(tenantUid: string, leadUid: string, data: ICreateLeadNote, createdBy: string, ipAddress?: string, userAgent?: string): Promise<ILeadNoteSafe> {
        logger.info("LeadNoteService.createLeadNote", { tenantUid, leadUid });

        try {
            const note = await this.repository.create(tenantUid, leadUid, data, createdBy);

            await this.auditLogService.log({
                tenantUid,
                module: "Lead Notes",
                recordUid: note.uid,
                action: AUDIT_LOG_ACTIONS.CREATE,
                message: `User created a new note for lead.`,
                ipAddress,
                userAgent,
                createdBy
            }).catch(err => logger.error("Audit log failed for Lead Note creation", err));

            return toLeadNoteSafe(note);
        } catch (error) {
            logger.error("LeadNoteService.createLeadNote error", { error });
            throw new CustomError("Failed to create lead note", 500);
        }
    }

    async updateLeadNote(tenantUid: string, leadUid: string, uid: string, data: IUpdateLeadNote, updatedBy: string, ipAddress?: string, userAgent?: string): Promise<ILeadNoteSafe> {
        logger.info("LeadNoteService.updateLeadNote", { tenantUid, leadUid, uid });

        const oldNote = await this.repository.getByUid(tenantUid, leadUid, uid);
        if (!oldNote) {
            throw new CustomError("Lead note not found", 404);
        }

        try {
            const updatedNote = await this.repository.update(tenantUid, leadUid, uid, data, updatedBy);
            if (!updatedNote) {
                throw new CustomError("Failed to update lead note", 500);
            }

            await this.auditLogService.logUpdate({
                tenantUid,
                module: "Lead Notes",
                recordUid: uid,
                oldRecord: oldNote,
                newRecord: updatedNote,
                ipAddress,
                userAgent,
                createdBy: updatedBy
            }).catch(err => logger.error("Audit log failed for Lead Note update", err));

            return toLeadNoteSafe(updatedNote);
        } catch (error) {
            if (error instanceof CustomError) throw error;
            logger.error("LeadNoteService.updateLeadNote error", { error });
            throw new CustomError("Failed to update lead note", 500);
        }
    }

    async deleteLeadNote(tenantUid: string, leadUid: string, uid: string, deletedBy: string, ipAddress?: string, userAgent?: string): Promise<void> {
        logger.info("LeadNoteService.deleteLeadNote", { tenantUid, leadUid, uid });

        const oldNote = await this.repository.getByUid(tenantUid, leadUid, uid);
        if (!oldNote) {
            throw new CustomError("Lead note not found", 404);
        }

        try {
            const success = await this.repository.softDelete(tenantUid, leadUid, uid, deletedBy);
            if (!success) {
                throw new CustomError("Failed to delete lead note", 500);
            }

            await this.auditLogService.log({
                tenantUid,
                module: "Lead Notes",
                recordUid: uid,
                action: AUDIT_LOG_ACTIONS.DELETE,
                message: `User deleted lead note.`,
                ipAddress,
                userAgent,
                createdBy: deletedBy
            }).catch(err => logger.error("Audit log failed for Lead Note deletion", err));

        } catch (error) {
            if (error instanceof CustomError) throw error;
            logger.error("LeadNoteService.deleteLeadNote error", { error });
            throw new CustomError("Failed to delete lead note", 500);
        }
    }

    async getPaginated(tenantUid: string, query: ILeadNotePaginationQuery): Promise<{ data: ILeadNoteSafe[], meta: any }> {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = query.limit && query.limit > 0 ? query.limit : 10;

        const result = await this.repository.getPaginated(tenantUid, query.leadUid, page, limit, query.search);

        return {
            data: result.rows.map(toLeadNoteSafe),
            meta: {
                total: result.total,
                page,
                limit,
                totalPages: Math.ceil(result.total / limit),
            },
        };
    }

    async getAll(tenantUid: string, leadUid: string): Promise<{ data: ILeadNoteSafe[] }> {
        const notes = await this.repository.getAll(tenantUid, leadUid);
        return {
            data: notes.map(toLeadNoteSafe)
        };
    }
}

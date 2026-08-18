import { Router } from "express";
import { LeadNoteController } from "../controllers/lead-note.controller.js";
import { LeadNoteService } from "../services/lead-note.service.js";
import { LeadNoteRepository } from "../repositories/lead-note.repository.js";
import { AuditLogService } from "../../audit-logs/services/audit-logs.service.js";
import { AuditLogRepository } from "../../audit-logs/repositories/audit-logs.repository.js";
import { createLeadNoteSchema, updateLeadNoteSchema } from "../validators/lead-note.validator.js";
import { validateLeadRequest } from "../validators/lead.validator.js";
import { authenticate } from "../../auth/middleware/auth.middleware.js";
import pool from "@packages/connection.js";

function createLeadNoteRouter(): Router {
    const router = Router({ mergeParams: true });

    const auditLogRepository = new AuditLogRepository(pool);
    const auditLogService = new AuditLogService(auditLogRepository);
    const repository = new LeadNoteRepository(pool);
    const service = new LeadNoteService(repository, auditLogService);
    const controller = new LeadNoteController(service);

    router.use(authenticate);

    router.post(
        "/",
        validateLeadRequest(createLeadNoteSchema),
        controller.createLeadNote
    );

    router.post(
        "/list",
        controller.getPaginated
    );

    router.get(
        "/all",
        controller.getAll
    );

    router.put(
        "/:uid",
        validateLeadRequest(updateLeadNoteSchema),
        controller.updateLeadNote
    );

    router.delete(
        "/:uid",
        controller.deleteLeadNote
    );

    return router;
}

export const leadNoteRoutes = createLeadNoteRouter();

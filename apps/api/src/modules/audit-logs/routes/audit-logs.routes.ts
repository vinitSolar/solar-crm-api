import { Router } from "express";
import { AuditLogController } from "../controllers/audit-logs.controller.js";
import { AuditLogService } from "../services/audit-logs.service.js";
import { AuditLogRepository } from "../repositories/audit-logs.repository.js";
import { getAuditLogsValidator } from "../validators/audit-logs.validator.js";
import { validateRequest } from "../../../middlewares/validate-request.js";
import { authenticate } from "../../auth/middleware/auth.middleware.js";
import pool from "@packages/connection.js";

const router = Router();

// Dependency Injection
const repository = new AuditLogRepository(pool);
const service = new AuditLogService(repository);
const controller = new AuditLogController(service);

// Routes
router.post(
    "/list",
    authenticate,
    validateRequest(getAuditLogsValidator),
    controller.getLogs
);

export default router;

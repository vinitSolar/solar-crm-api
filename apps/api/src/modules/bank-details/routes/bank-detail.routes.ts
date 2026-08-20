import { Router } from "express";
import { BankDetailController } from "../controllers/bank-detail.controller.js";
import { BankDetailService } from "../services/bank-detail.service.js";
import { BankDetailRepository } from "../repositories/bank-detail.repository.js";
import { createBankDetailSchema, updateBankDetailSchema, validateBankDetailRequest } from "../validators/bank-detail.validator.js";
import { authenticate, authorizeRoleName } from "../../auth/middleware/auth.middleware.js";
import pool from "@packages/connection.js";

export function createBankDetailRouter(): Router {
    const router = Router();
    
    const repository = new BankDetailRepository(pool);
    const service = new BankDetailService(repository);
    const controller = new BankDetailController(service);

    // Apply authentication middleware to all routes
    router.use(authenticate);

    // GET /api/v1/bank-details/default
    router.get(
        "/default",
        controller.getDefault
    );

    // GET /api/v1/bank-details
    router.get(
        "/",
        authorizeRoleName("Master"),
        controller.getAll
    );

    // POST /api/v1/bank-details
    router.post(
        "/",
        authorizeRoleName("Master"),
        validateBankDetailRequest(createBankDetailSchema),
        controller.create
    );

    // PUT /api/v1/bank-details/:uid
    router.put(
        "/:uid",
        authorizeRoleName("Master"),
        validateBankDetailRequest(updateBankDetailSchema),
        controller.update
    );

    // DELETE /api/v1/bank-details/:uid
    router.delete(
        "/:uid",
        authorizeRoleName("Master"),
        controller.delete
    );

    return router;
}

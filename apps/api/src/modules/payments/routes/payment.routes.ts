import { Router } from "express";
import { PaymentController } from "../controllers/payment.controller.js";
import { PaymentService } from "../services/payment.service.js";
import { PaymentRepository } from "../repositories/payment.repository.js";
import { LeadRepository } from "../../leads/repositories/lead.repository.js";
import { AuditLogRepository } from "../../audit-logs/repositories/audit-logs.repository.js";
import { AuditLogService } from "../../audit-logs/services/audit-logs.service.js";
import {
    createPaymentSchema,
    updatePaymentSchema,
    getByUidSchema,
    getByLeadUidSchema,
    paginationSchema,
    validatePaymentRequest,
} from "../validators/payment.validator.js";
import { authenticate } from "../../auth/middleware/auth.middleware.js";
import pool from "@packages/connection.js";

function createPaymentRouter(): Router {
    const router = Router();

    const paymentRepository = new PaymentRepository(pool);
    const leadRepository = new LeadRepository(pool);
    const auditLogRepository = new AuditLogRepository(pool);
    const auditLogService = new AuditLogService(auditLogRepository);
    const paymentService = new PaymentService(paymentRepository, leadRepository, auditLogService);
    const paymentController = new PaymentController(paymentService);

    router.use(authenticate);

    /**
     * @swagger
     * /payments/list:
     *   post:
     *     tags: [Payments]
     *     summary: Get paginated payments
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/paginationSchemaBody'
     */
    router.post(
        "/list",
        validatePaymentRequest(paginationSchema),
        paymentController.getPaymentsPaginated,
    );

    /**
     * @swagger
     * /payments/summary/{leadUid}:
     *   get:
     *     tags: [Payments]
     *     summary: Get payment summary for a lead
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: leadUid
     *         required: true
     */
    router.get(
        "/summary/:leadUid",
        validatePaymentRequest(getByLeadUidSchema),
        paymentController.getLeadPaymentSummary,
    );

    /**
     * @swagger
     * /payments/{uid}:
     *   get:
     *     tags: [Payments]
     *     summary: Get a payment by UID
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: uid
     *         required: true
     */
    router.get(
        "/:uid",
        validatePaymentRequest(getByUidSchema),
        paymentController.getPaymentByUid,
    );

    /**
     * @swagger
     * /payments:
     *   post:
     *     tags: [Payments]
     *     summary: Create a new payment
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/createPaymentSchemaBody'
     */
    router.post(
        "/",
        validatePaymentRequest(createPaymentSchema),
        paymentController.createPayment,
    );

    /**
     * @swagger
     * /payments/{uid}:
     *   put:
     *     tags: [Payments]
     *     summary: Update an existing payment
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: uid
     *         required: true
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/updatePaymentSchemaBody'
     */
    router.put(
        "/:uid",
        validatePaymentRequest(updatePaymentSchema),
        paymentController.updatePayment,
    );

    /**
     * @swagger
     * /payments/{uid}:
     *   delete:
     *     tags: [Payments]
     *     summary: Delete a payment
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: uid
     *         required: true
     */
    router.delete(
        "/:uid",
        validatePaymentRequest(getByUidSchema),
        paymentController.deletePayment,
    );

    return router;
}

export const paymentRoutes = createPaymentRouter();

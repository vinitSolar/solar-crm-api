import { CustomError } from "../../../middlewares/error.middleware.js";
import type { PaymentRepository } from "../repositories/payment.repository.js";
import type { LeadRepository } from "../../leads/repositories/lead.repository.js";
import type { AuditLogService } from "../../audit-logs/services/audit-logs.service.js";
import { notificationService } from "../../notification/services/notification.service.js";
import { PAYMENT_MESSAGES } from "../constants/payment.constants.js";
import { NOTIFICATION_CHANNEL, NOTIFICATION_TEMPLATE } from "../../notification/constants/notification.constants.js";
import type {
    IPayment,
    ICreatePayment,
    IUpdatePayment,
    IPaymentSafe,
    IPaymentSummary,
} from "../interfaces/payment.interface.js";
import { toPaymentSafe } from "../dto/payment.dto.js";
import type { IPaginationQuery, IPaginatedResponse } from "../../leads/interfaces/lead.interface.js";
import { AUDIT_LOG_ACTIONS } from "../../audit-logs/constants/audit-logs.constants.js";

import { storageService } from "@packages/storage/index.js";
import path from "path";

export class PaymentService {
    private paymentRepository: PaymentRepository;
    private leadRepository: LeadRepository;
    private auditLogService: AuditLogService;

    constructor(
        paymentRepository: PaymentRepository,
        leadRepository: LeadRepository,
        auditLogService: AuditLogService
    ) {
        this.paymentRepository = paymentRepository;
        this.leadRepository = leadRepository;
        this.auditLogService = auditLogService;
    }

    async createPayment(
        tenantUid: string,
        data: ICreatePayment,
        file: Express.Multer.File | undefined,
        userUid: string,
        ipAddress?: string,
        userAgent?: string
    ): Promise<IPaymentSafe> {
        // 1. Validate Lead exists and belongs to tenant
        const lead = await this.leadRepository.getByUid(tenantUid, data.leadUid);
        if (!lead) {
            throw new CustomError(PAYMENT_MESSAGES.LEAD_NOT_FOUND, 404);
        }

        // Upload file if provided
        if (file) {
            const folder = `payments/${tenantUid}/${data.leadUid}`;
            const fileUrlResult = await storageService.uploadFileWithPath(
                file.buffer,
                file.originalname,
                file.mimetype,
                folder,
            );
            data.imageProof = fileUrlResult.url;
        }

        // 2. Create payment
        const payment = await this.paymentRepository.create(tenantUid, data, userUid);
        if (!payment) {
            throw new CustomError(PAYMENT_MESSAGES.CREATION_FAILED, 500);
        }

        // 3. Log Audit
        await this.auditLogService.log({
            tenantUid,
            module: "payments",
            recordUid: payment.uid,
            action: AUDIT_LOG_ACTIONS.CREATE,
            message: `Payment of ${payment.amount} created for Lead ${lead.leadNumber}`,
            metadata: payment,
            createdBy: userUid,
            ipAddress,
            userAgent,
        });

        // 4. Notification logic
        if (lead.email) {
            try {
                await notificationService.send({
                    tenantUid,
                    channel: NOTIFICATION_CHANNEL.EMAIL,
                    template: NOTIFICATION_TEMPLATE.PAYMENT_RECEIVED,
                    recipient: lead.email,
                    module: "payments",
                    referenceUid: payment.uid,
                    variables: {
                        leadName: lead.firstName,
                        amount: payment.amount.toString(),
                        paymentDate: payment.paymentDate.toISOString(),
                        transactionReference: payment.transactionReference || "N/A"
                    }
                });
            } catch (error) {
                // Notifications are best-effort, do not fail the transaction
                console.error("Failed to queue payment notification:", error);
            }
        }

        return toPaymentSafe(payment);
    }

    async updatePayment(
        uid: string,
        tenantUid: string,
        data: IUpdatePayment,
        file: Express.Multer.File | undefined,
        userUid: string,
        ipAddress?: string,
        userAgent?: string
    ): Promise<IPaymentSafe> {
        const oldPayment = await this.paymentRepository.getByUid(uid, tenantUid);
        if (!oldPayment) {
            throw new CustomError(PAYMENT_MESSAGES.NOT_FOUND, 404);
        }

        // Upload file if provided
        if (file) {
            const folder = `payments/${tenantUid}/${oldPayment.leadUid}`;
            const fileUrlResult = await storageService.uploadFileWithPath(
                file.buffer,
                file.originalname,
                file.mimetype,
                folder,
            );
            data.imageProof = fileUrlResult.url;
        }

        const payment = await this.paymentRepository.update(uid, tenantUid, data, userUid);
        if (!payment) {
            throw new CustomError(PAYMENT_MESSAGES.UPDATE_FAILED, 500);
        }

        await this.auditLogService.logUpdate({
            tenantUid,
            module: "payments",
            recordUid: payment.uid,
            oldRecord: oldPayment,
            newRecord: payment,
            createdBy: userUid,
            ipAddress,
            userAgent,
        });

        // Removed status change to Paid notification as status is removed and all payments are considered paid.

        return toPaymentSafe(payment);
    }

    async getPaymentByUid(uid: string, tenantUid: string): Promise<IPaymentSafe> {
        const payment = await this.paymentRepository.getByUid(uid, tenantUid);
        if (!payment) {
            throw new CustomError(PAYMENT_MESSAGES.NOT_FOUND, 404);
        }
        return toPaymentSafe(payment);
    }

    async getPaymentsPaginated(
        tenantUid: string,
        query: IPaginationQuery & { leadUid?: string }
    ): Promise<IPaginatedResponse<IPaymentSafe>> {
        const { data, total } = await this.paymentRepository.getPaginated(tenantUid, query);
        const { page = 1, limit = 10 } = query;

        return {
            data: data.map(toPaymentSafe),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getLeadPaymentSummary(leadUid: string, tenantUid: string): Promise<IPaymentSummary> {
        // Validate lead exists
        const lead = await this.leadRepository.getByUid(tenantUid, leadUid);
        if (!lead) {
            throw new CustomError(PAYMENT_MESSAGES.LEAD_NOT_FOUND, 404);
        }

        return this.paymentRepository.getLeadSummary(leadUid, tenantUid);
    }

    async deletePayment(
        uid: string,
        tenantUid: string,
        userUid: string,
        ipAddress?: string,
        userAgent?: string
    ): Promise<void> {
        const payment = await this.paymentRepository.getByUid(uid, tenantUid);
        if (!payment) {
            throw new CustomError(PAYMENT_MESSAGES.NOT_FOUND, 404);
        }

        const success = await this.paymentRepository.softDelete(uid, tenantUid, userUid);
        if (!success) {
            throw new CustomError(PAYMENT_MESSAGES.DELETE_FAILED, 500);
        }

        await this.auditLogService.log({
            tenantUid,
            module: "payments",
            recordUid: uid,
            action: AUDIT_LOG_ACTIONS.DELETE,
            message: `Payment deleted`,
            metadata: null,
            createdBy: userUid,
            ipAddress,
            userAgent,
        });
    }
}

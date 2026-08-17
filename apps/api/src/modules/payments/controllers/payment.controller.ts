import type { Request, Response, NextFunction } from "express";
import type { IAuthenticatedRequest } from "../../auth/interfaces/auth.interface.js";
import type { PaymentService } from "../services/payment.service.js";
import { PAYMENT_MESSAGES } from "../constants/payment.constants.js";

export class PaymentController {
    private paymentService: PaymentService;

    constructor(paymentService: PaymentService) {
        this.paymentService = paymentService;
    }

    createPayment = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const payment = await this.paymentService.createPayment(
                authReq.tenantUid,
                authReq.body,
                authReq.file,
                authReq.user.uid,
                authReq.ip,
                authReq.headers["user-agent"] as string
            );
            res.status(201).json({
                success: true,
                message: PAYMENT_MESSAGES.CREATED,
                data: payment,
            });
        } catch (error) {
            next(error);
        }
    };

    updatePayment = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const payment = await this.paymentService.updatePayment(
                authReq.params.uid as string,
                authReq.tenantUid,
                authReq.body,
                authReq.file,
                authReq.user.uid,
                authReq.ip,
                authReq.headers["user-agent"] as string
            );
            res.status(200).json({
                success: true,
                message: PAYMENT_MESSAGES.UPDATED,
                data: payment,
            });
        } catch (error) {
            next(error);
        }
    };

    getPaymentByUid = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const payment = await this.paymentService.getPaymentByUid(authReq.params.uid as string, authReq.tenantUid);
            res.status(200).json({
                success: true,
                message: PAYMENT_MESSAGES.FETCHED_SUCCESSFULLY,
                data: payment,
            });
        } catch (error) {
            next(error);
        }
    };

    getPaymentsPaginated = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const result = await this.paymentService.getPaymentsPaginated(authReq.tenantUid, authReq.body);
            res.status(200).json({
                success: true,
                message: PAYMENT_MESSAGES.FETCHED_SUCCESSFULLY,
                ...result,
            });
        } catch (error) {
            next(error);
        }
    };

    getLeadPaymentSummary = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const summary = await this.paymentService.getLeadPaymentSummary(authReq.params.leadUid as string, authReq.tenantUid);
            res.status(200).json({
                success: true,
                message: PAYMENT_MESSAGES.SUMMARY_FETCHED,
                data: summary,
            });
        } catch (error) {
            next(error);
        }
    };

    deletePayment = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            await this.paymentService.deletePayment(
                authReq.params.uid as string,
                authReq.tenantUid,
                authReq.user.uid,
                authReq.ip,
                authReq.headers["user-agent"] as string
            );
            res.status(200).json({
                success: true,
                message: PAYMENT_MESSAGES.DELETED,
                data: null,
            });
        } catch (error) {
            next(error);
        }
    };
}

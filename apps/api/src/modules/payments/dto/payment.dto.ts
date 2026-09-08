import type { IPayment, IPaymentSafe } from "../interfaces/payment.interface.js";
import { storageService } from "@packages/storage/index.js";

export function toPaymentSafe(payment: IPayment): IPaymentSafe {
    return {
        uid: payment.uid,
        leadUid: payment.leadUid,
        amount: Number(payment.amount),
        paymentMethod: payment.paymentMethod,
        transactionReference: payment.transactionReference,
        paymentDate: payment.paymentDate,
        imageProof: storageService.getPublicUrl(payment.imageProof),
        notes: payment.notes,
        isActive: payment.isActive,
        isDeleted: payment.isDeleted,
        createdAt: payment.createdAt,
        totalAmountDue: Number(payment.totalAmountDue),
    };
}

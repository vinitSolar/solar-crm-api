export interface IPayment {
    id: string;
    uid: string;
    tenantUid: string;
    leadUid: string;
    amount: number;
    paymentMethod: number;
    transactionReference: string | null;
    paymentDate: Date;
    status: number;
    notes: string | null;
    isActive: number;
    isDeleted: number;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string | null;
    updatedBy: string | null;
    deletedBy: string | null;
    totalAmountDue: number;
}

export interface ICreatePayment {
    leadUid: string;
    amount: number;
    paymentMethod: number;
    transactionReference?: string;
    paymentDate: Date | string;
    status?: number;
    notes?: string;
}

export interface IUpdatePayment extends Partial<ICreatePayment> {}

export interface IPaymentSafe {
    uid: string;
    leadUid: string;
    amount: number;
    paymentMethod: number;
    transactionReference: string | null;
    paymentDate: Date;
    status: number;
    notes: string | null;
    isActive: number;
    isDeleted: number;
    createdAt: Date;
    totalAmountDue: number;
}

export interface IPaymentSummary {
    totalCount: number;
    totalPaid: number;
    totalPending: number;
    totalRefunded: number;
}

export interface ICustomerHistory {
    id: number;
    uid: string;
    tenantUid: string;
    leadUid: string;
    quotationUid?: string | null;
    projectUid?: string | null;

    // Customer / Lead Snapshot
    leadNumber?: string | null;
    customerName?: string | null;
    mobileNumber?: string | null;
    alternateNumber?: string | null;
    email?: string | null;
    address?: string | null;
    landmark?: string | null;
    locality?: string | null;
    city?: string | null;
    state?: string | null;
    pinCode?: string | null;
    category?: number;
    consumerAccountNumber?: string | null;
    monthlyBillAmount?: number | null;
    systemSize?: number | null;

    // Package & Pricing Snapshot
    packageUid?: string | null;
    packageName?: string | null;
    packagePrice?: number | null;
    packageDetails?: any;

    // Quotation Snapshot
    quotationNumber?: string | null;
    subtotal?: number | null;
    gstAmount?: number | null;
    grandTotal?: number | null;
    discount?: number | null;
    netCustomerCost?: number | null;
    subsidyAmount?: number | null;
    subsidyDetails?: any;
    quotationSnapshot?: any;

    // Project & Implementation Snapshot
    projectNumber?: string | null;
    projectName?: string | null;
    projectStatus?: string | null;
    projectManagerName?: string | null;
    projectDetails?: any;

    // Payments Snapshot
    totalPaid?: number | null;
    paymentDetails?: any;

    // Status & Closure Details
    currentStatus: string;
    isClosed: number;
    closureStatus?: string | null;
    closureReason?: string | null;
    closedAt?: Date | string | null;
    closedBy?: string | null;

    // Base Fields
    isActive: number;
    isDeleted: number;
    createdAt: Date | string;
    updatedAt: Date | string;
    createdBy?: string | null;
    updatedBy?: string | null;
}

export interface IQuotationHistoryPayload {
    leadUid: string;
    quotationUid: string;
    quotationNumber: string;
    packageUid?: string | null;
    packageName?: string | null;
    packagePrice?: number | null;
    packageDetails?: any;
    subtotal: number;
    gstAmount: number;
    grandTotal: number;
    discount: number;
    netCustomerCost: number;
    subsidyAmount?: number;
    subsidyDetails?: any;
    quotationSnapshot?: any;
}

export interface ILeadClosedHistoryPayload {
    leadUid: string;
    closureStatus: string; // e.g. 'Won', 'Lost'
    closureReason?: string | null;
    closedBy?: string | null;
}

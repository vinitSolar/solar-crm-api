export interface IQuotation {
    id: string;
    uid: string;
    tenantUid: string;
    leadUid: string;
    quotationNumber: string;
    systemSize: number;
    validTill: Date;
    status: number;
    notes: string | null;
    pdfUrl: string | null;
    pdfPath: string | null;
    isActive: number;
    isDeleted: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    createdBy: string | null;
    updatedBy: string | null;
    deletedBy: string | null;
}

export interface IQuotationItem {
    id: string;
    uid: string;
    quotationUid: string;
    productUid: string;
    productName: string;
    brandName: string;
    unitName: string;
    quantity: number;
    pricePerUnit: number;
    gstPercentage: number;
    lineTotal: number;
    description: string | null;
    isActive: number;
    isDeleted: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    createdBy: string | null;
    updatedBy: string | null;
    deletedBy: string | null;
}

export interface IQuotationScopeOfWorkItem {
    id: string;
    uid: string;
    quotationUid: string;
    title: string;
    value: string;
    sortOrder: number;
    isActive: number;
    isDeleted: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    createdBy: string | null;
    updatedBy: string | null;
    deletedBy: string | null;
}

export interface IQuotationTermsConditionsItem {
    id: string;
    uid: string;
    quotationUid: string;
    title: string;
    description: string;
    sortOrder: number;
    isActive: number;
    isDeleted: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    createdBy: string | null;
    updatedBy: string | null;
    deletedBy: string | null;
}

export interface ICreateQuotationItemRequest {
    productUid: string;
    quantity: number;
    productName?: string;
    pricePerUnit?: number;
    gstPercentage?: number;
    description?: string;
}

export interface ICreateQuotationScopeOfWorkRequest {
    title: string;
    value: string;
    sortOrder?: number;
}

export interface ICreateQuotationTermsConditionsRequest {
    title: string;
    description: string;
    sortOrder?: number;
}

export interface ICreateQuotationRequest {
    leadUid: string;
    systemSize?: number;
    validTill: string; // ISO date string (YYYY-MM-DD)
    notes?: string;
    products: ICreateQuotationItemRequest[];
    scopeOfWork?: ICreateQuotationScopeOfWorkRequest[];
    termsConditions?: ICreateQuotationTermsConditionsRequest[];
}

export interface IUpdateQuotationRequest {
    leadUid?: string;
    systemSize?: number;
    validTill?: string;
    notes?: string;
    status?: number;
    products?: ICreateQuotationItemRequest[];
    scopeOfWork?: ICreateQuotationScopeOfWorkRequest[];
    termsConditions?: ICreateQuotationTermsConditionsRequest[];
}

export interface IQuotationPaginationQuery {
    page: number;
    limit: number;
    search?: string;
    status?: "active" | "deleted" | "all";
}

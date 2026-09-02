import type { 
    IQuotation, 
    IQuotationItem, 
    IQuotationScopeOfWorkItem, 
    IQuotationTermsConditionsItem 
} from "../interfaces/quotation.interface.js";

export interface SafeQuotationItemResponse {
    uid: string;
    productUid: string;
    productName: string;
    brandName: string;
    unitName: string;
    quantity: number;
    pricePerUnit: number;
    gstPercentage: number;
    lineTotal: number;
    description: string | null;
    isExtra: number;
    isActive: number;
    isDeleted: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface SafeQuotationScopeOfWorkItemResponse {
    uid: string;
    scopeOfWorkUid: string | null;
    title: string;
    value: string;
    sortOrder: number;
    isExtra: number;
    isActive: number;
    isDeleted: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface SafeQuotationTermsConditionsItemResponse {
    uid: string;
    title: string;
    description: string[];
    sortOrder: number;
    isActive: number;
    isDeleted: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface SafeQuotationResponse {
    uid: string;
    leadUid: string;
    packageUid: string | null;
    subtotal: number;
    gstAmount: number;
    grandTotal: number;
    discount: number;
    subsidyData: any[];
    netCustomerCost: number;
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
    items: SafeQuotationItemResponse[];
    scopeOfWork: SafeQuotationScopeOfWorkItemResponse[];
    termsConditions: SafeQuotationTermsConditionsItemResponse[];
    audit: {
        createdBy: string | null;
        createdAt: Date;
        updatedBy: string | null;
        updatedAt: Date;
    };
}

export const toSafeQuotationItem = (item: IQuotationItem): SafeQuotationItemResponse => {
    return {
        uid: item.uid,
        productUid: item.productUid,
        productName: item.productName,
        brandName: item.brandName,
        unitName: item.unitName,
        quantity: Number(item.quantity),
        pricePerUnit: Number(item.pricePerUnit),
        gstPercentage: Number(item.gstPercentage),
        lineTotal: Number(item.lineTotal),
        description: item.description,
        isExtra: item.isExtra,
        isActive: item.isActive,
        isDeleted: item.isDeleted,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
    };
};

export const toSafeQuotationScopeOfWorkItem = (item: IQuotationScopeOfWorkItem): SafeQuotationScopeOfWorkItemResponse => {
    return {
        uid: item.uid,
        scopeOfWorkUid: (item as any).scopeOfWorkUid ?? null,
        title: item.title,
        value: item.value,
        sortOrder: item.sortOrder,
        isExtra: item.isExtra,
        isActive: item.isActive,
        isDeleted: item.isDeleted,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
    };
};

export const toSafeQuotationTermsConditionsItem = (item: IQuotationTermsConditionsItem): SafeQuotationTermsConditionsItemResponse => {
    return {
        uid: item.uid,
        title: item.title,
        description: item.description,
        sortOrder: item.sortOrder,
        isActive: item.isActive,
        isDeleted: item.isDeleted,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
    };
};

export const toSafeQuotation = (
    quotation: IQuotation,
    items: IQuotationItem[] = [],
    scopeOfWork: IQuotationScopeOfWorkItem[] = [],
    termsConditions: IQuotationTermsConditionsItem[] = []
): SafeQuotationResponse => {
    const safeItems = items.map(toSafeQuotationItem);

    return {
        uid: quotation.uid,
        leadUid: quotation.leadUid,
        packageUid: quotation.packageUid,
        subtotal: quotation.subtotal,
        gstAmount: quotation.gstAmount,
        grandTotal: quotation.grandTotal,
        discount: quotation.discount,
        subsidyData: quotation.subsidyData,
        netCustomerCost: quotation.netCustomerCost,
        quotationNumber: quotation.quotationNumber,
        systemSize: Number(quotation.systemSize),
        validTill: quotation.validTill,
        status: quotation.status,
        notes: quotation.notes,
        pdfUrl: quotation.pdfUrl,
        pdfPath: quotation.pdfPath,
        isActive: quotation.isActive,
        isDeleted: quotation.isDeleted,
        createdAt: quotation.createdAt,
        updatedAt: quotation.updatedAt,
        items: safeItems,
        scopeOfWork: scopeOfWork.map(toSafeQuotationScopeOfWorkItem),
        termsConditions: termsConditions.map(toSafeQuotationTermsConditionsItem),
        audit: {
            createdBy: quotation.createdByName || quotation.createdBy || null,
            createdAt: quotation.createdAt,
            updatedBy: quotation.updatedByName || quotation.updatedBy || null,
            updatedAt: quotation.updatedAt
        }
    };
};

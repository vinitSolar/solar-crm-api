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
    isActive: number;
    isDeleted: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface SafeQuotationScopeOfWorkItemResponse {
    uid: string;
    title: string;
    value: string;
    sortOrder: number;
    isActive: number;
    isDeleted: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface SafeQuotationTermsConditionsItemResponse {
    uid: string;
    title: string;
    description: string;
    sortOrder: number;
    isActive: number;
    isDeleted: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface SafeQuotationResponse {
    uid: string;
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
    subtotal: number;
    gstAmount: number;
    grandTotal: number;
    items: SafeQuotationItemResponse[];
    scopeOfWork: SafeQuotationScopeOfWorkItemResponse[];
    termsConditions: SafeQuotationTermsConditionsItemResponse[];
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
        isActive: item.isActive,
        isDeleted: item.isDeleted,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
    };
};

export const toSafeQuotationScopeOfWorkItem = (item: IQuotationScopeOfWorkItem): SafeQuotationScopeOfWorkItemResponse => {
    return {
        uid: item.uid,
        title: item.title,
        value: item.value,
        sortOrder: item.sortOrder,
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
    let subtotal = 0;
    let gstAmount = 0;

    const safeItems = items.map(item => {
        const safeItem = toSafeQuotationItem(item);
        subtotal += safeItem.lineTotal;
        gstAmount += safeItem.lineTotal * (safeItem.gstPercentage / 100);
        return safeItem;
    });

    subtotal = Math.round(subtotal * 100) / 100;
    gstAmount = Math.round(gstAmount * 100) / 100;
    const grandTotal = Math.round((subtotal + gstAmount) * 100) / 100;

    return {
        uid: quotation.uid,
        leadUid: quotation.leadUid,
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
        subtotal,
        gstAmount,
        grandTotal,
        items: safeItems,
        scopeOfWork: scopeOfWork.map(toSafeQuotationScopeOfWorkItem),
        termsConditions: termsConditions.map(toSafeQuotationTermsConditionsItem)
    };
};

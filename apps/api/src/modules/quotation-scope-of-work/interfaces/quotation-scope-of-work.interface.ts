export interface IQuotationScopeOfWork {
    uid: string;
    tenantUid: string;
    title: string;
    value: string;
    sortOrder: number;
    isDefault: number;
    isActive: number;
    isDeleted: number;
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string;
    updatedBy?: string;
    deletedBy?: string;
}

import type { IQuotationScopeOfWork } from "../interfaces/quotation-scope-of-work.interface.js";

export type CreateQuotationScopeOfWorkDTO = Pick<IQuotationScopeOfWork, "title" | "value"> & Partial<Pick<IQuotationScopeOfWork, "sortOrder" | "isDefault">>;

export type UpdateQuotationScopeOfWorkDTO = Partial<CreateQuotationScopeOfWorkDTO & Pick<IQuotationScopeOfWork, "isActive">>;

export type SafeQuotationScopeOfWorkResponse = Omit<
    IQuotationScopeOfWork,
    "tenantUid" | "createdBy" | "updatedBy" | "deletedBy"
>;

export const toSafeQuotationScopeOfWork = (record: IQuotationScopeOfWork): SafeQuotationScopeOfWorkResponse => {
    return {
        uid: record.uid,
        title: record.title,
        value: record.value,
        sortOrder: record.sortOrder,
        isDefault: record.isDefault,
        isActive: record.isActive,
        isDeleted: record.isDeleted,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
    };
};

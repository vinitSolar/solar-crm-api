import type { IQuotationTermsCondition } from "../interfaces/quotation-terms-condition.interface.js";

export type CreateQuotationTermsConditionDTO = Pick<IQuotationTermsCondition, "title" | "description"> & Partial<Pick<IQuotationTermsCondition, "sortOrder" | "isDefault">>;

export type UpdateQuotationTermsConditionDTO = Partial<CreateQuotationTermsConditionDTO & Pick<IQuotationTermsCondition, "isActive">>;

export type SafeQuotationTermsConditionResponse = Omit<
    IQuotationTermsCondition,
    "tenantUid" | "createdBy" | "updatedBy" | "deletedBy"
>;

export const toSafeQuotationTermsCondition = (record: IQuotationTermsCondition): SafeQuotationTermsConditionResponse => {
    return {
        uid: record.uid,
        title: record.title,
        description: record.description,
        sortOrder: record.sortOrder,
        isDefault: record.isDefault,
        isActive: record.isActive,
        isDeleted: record.isDeleted,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
    };
};

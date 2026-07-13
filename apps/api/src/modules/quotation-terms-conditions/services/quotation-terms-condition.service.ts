import { QuotationTermsConditionRepository } from "../repositories/quotation-terms-condition.repository.js";
import { type CreateQuotationTermsConditionDTO, type UpdateQuotationTermsConditionDTO, type SafeQuotationTermsConditionResponse, toSafeQuotationTermsCondition } from "../dto/quotation-terms-condition.dto.js";
import { CustomError } from "../../../middlewares/error.middleware.js";
import { QUOTATION_TERMS_CONDITION_ERRORS } from "../constants/quotation-terms-condition.constants.js";

export class QuotationTermsConditionService {
    private readonly repository: QuotationTermsConditionRepository;

    constructor() {
        this.repository = new QuotationTermsConditionRepository();
    }

    async create(
        tenantUid: string,
        data: CreateQuotationTermsConditionDTO,
        createdBy: string
    ): Promise<SafeQuotationTermsConditionResponse> {
        const existing = await this.repository.findByTitle(tenantUid, data.title);
        if (existing) {
            throw new CustomError(QUOTATION_TERMS_CONDITION_ERRORS.DUPLICATE_TITLE, 400);
        }

        const created = await this.repository.create(tenantUid, data, createdBy);
        return toSafeQuotationTermsCondition(created);
    }

    async getByUid(tenantUid: string, uid: string): Promise<SafeQuotationTermsConditionResponse> {
        const record = await this.repository.findByUid(tenantUid, uid);
        if (!record) {
            throw new CustomError(QUOTATION_TERMS_CONDITION_ERRORS.NOT_FOUND, 404);
        }
        return toSafeQuotationTermsCondition(record);
    }

    async update(
        tenantUid: string,
        uid: string,
        data: UpdateQuotationTermsConditionDTO,
        updatedBy: string
    ): Promise<SafeQuotationTermsConditionResponse> {
        const existing = await this.repository.findByUid(tenantUid, uid);
        if (!existing) {
            throw new CustomError(QUOTATION_TERMS_CONDITION_ERRORS.NOT_FOUND, 404);
        }

        if (data.title && data.title !== existing.title) {
            const titleExists = await this.repository.findByTitle(tenantUid, data.title);
            if (titleExists && titleExists.uid !== uid) {
                throw new CustomError(QUOTATION_TERMS_CONDITION_ERRORS.DUPLICATE_TITLE, 400);
            }
        }

        const updated = await this.repository.update(tenantUid, uid, data, updatedBy);
        if (!updated) {
            throw new CustomError(QUOTATION_TERMS_CONDITION_ERRORS.FAILED_TO_UPDATE, 500);
        }

        return toSafeQuotationTermsCondition(updated);
    }

    async list(
        tenantUid: string,
        page: number,
        limit: number,
        search?: string,
        status: "active" | "deleted" | "all" = "active",
        sortBy: "sort_order" | "created_at" = "sort_order",
        sortDir: "asc" | "desc" = "asc"
    ): Promise<{ data: SafeQuotationTermsConditionResponse[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
        const { data, total } = await this.repository.list(tenantUid, page, limit, search, status, sortBy, sortDir);
        
        return {
            data: data.map(toSafeQuotationTermsCondition),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getAll(tenantUid: string): Promise<SafeQuotationTermsConditionResponse[]> {
        const data = await this.repository.findAllActive(tenantUid);
        return data.map(toSafeQuotationTermsCondition);
    }

    async getDropdown(tenantUid: string): Promise<Array<{ uid: string; title: string }>> {
        const data = await this.repository.findAllActive(tenantUid);
        return data.map((item) => ({
            uid: item.uid,
            title: item.title,
        }));
    }

    async delete(tenantUid: string, uid: string, deletedBy: string): Promise<void> {
        const existing = await this.repository.findByUid(tenantUid, uid);
        if (!existing) {
            throw new CustomError(QUOTATION_TERMS_CONDITION_ERRORS.NOT_FOUND, 404);
        }

        if (existing.isDefault === 1) {
            throw new CustomError(QUOTATION_TERMS_CONDITION_ERRORS.DEFAULT_CANNOT_BE_DELETED, 400);
        }

        const success = await this.repository.softDelete(tenantUid, uid, deletedBy);
        if (!success) {
            throw new CustomError(QUOTATION_TERMS_CONDITION_ERRORS.FAILED_TO_DELETE, 500);
        }
    }
}

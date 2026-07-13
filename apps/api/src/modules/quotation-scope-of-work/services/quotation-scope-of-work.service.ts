import { QuotationScopeOfWorkRepository } from "../repositories/quotation-scope-of-work.repository.js";
import { type CreateQuotationScopeOfWorkDTO, type UpdateQuotationScopeOfWorkDTO, type SafeQuotationScopeOfWorkResponse, toSafeQuotationScopeOfWork } from "../dto/quotation-scope-of-work.dto.js";
import { CustomError } from "../../../middlewares/error.middleware.js";
import { QUOTATION_SCOPE_OF_WORK_VALIDATION_MESSAGES } from "../constants/quotation-scope-of-work.constants.js";

export class QuotationScopeOfWorkService {
    private readonly repository: QuotationScopeOfWorkRepository;

    constructor() {
        this.repository = new QuotationScopeOfWorkRepository();
    }

    async create(
        tenantUid: string,
        data: CreateQuotationScopeOfWorkDTO,
        createdBy: string
    ): Promise<SafeQuotationScopeOfWorkResponse> {
        const existing = await this.repository.findByTitle(tenantUid, data.title);
        if (existing) {
            throw new CustomError(QUOTATION_SCOPE_OF_WORK_VALIDATION_MESSAGES.TITLE_ALREADY_EXISTS, 400);
        }

        const created = await this.repository.create(tenantUid, data, createdBy);
        return toSafeQuotationScopeOfWork(created);
    }

    async getByUid(tenantUid: string, uid: string): Promise<SafeQuotationScopeOfWorkResponse> {
        const record = await this.repository.findByUid(tenantUid, uid);
        if (!record) {
            throw new CustomError(QUOTATION_SCOPE_OF_WORK_VALIDATION_MESSAGES.RECORD_NOT_FOUND, 404);
        }
        return toSafeQuotationScopeOfWork(record);
    }

    async update(
        tenantUid: string,
        uid: string,
        data: UpdateQuotationScopeOfWorkDTO,
        updatedBy: string
    ): Promise<SafeQuotationScopeOfWorkResponse> {
        const existing = await this.repository.findByUid(tenantUid, uid);
        if (!existing) {
            throw new CustomError(QUOTATION_SCOPE_OF_WORK_VALIDATION_MESSAGES.RECORD_NOT_FOUND, 404);
        }

        if (data.title && data.title !== existing.title) {
            const titleExists = await this.repository.findByTitle(tenantUid, data.title);
            if (titleExists && titleExists.uid !== uid) {
                throw new CustomError(QUOTATION_SCOPE_OF_WORK_VALIDATION_MESSAGES.TITLE_ALREADY_EXISTS, 400);
            }
        }

        const updated = await this.repository.update(tenantUid, uid, data, updatedBy);
        if (!updated) {
            throw new CustomError("Failed to update quotation scope of work", 500);
        }

        return toSafeQuotationScopeOfWork(updated);
    }

    async list(
        tenantUid: string,
        page: number,
        limit: number,
        search?: string,
        status: "active" | "deleted" | "all" = "active",
        sortBy: "sort_order" | "created_at" = "sort_order",
        sortDir: "asc" | "desc" = "asc"
    ): Promise<{ data: SafeQuotationScopeOfWorkResponse[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
        const { data, total } = await this.repository.list(tenantUid, page, limit, search, status, sortBy, sortDir);
        
        return {
            data: data.map(toSafeQuotationScopeOfWork),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getAll(tenantUid: string): Promise<SafeQuotationScopeOfWorkResponse[]> {
        const data = await this.repository.findAllActive(tenantUid);
        return data.map(toSafeQuotationScopeOfWork);
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
            throw new CustomError(QUOTATION_SCOPE_OF_WORK_VALIDATION_MESSAGES.RECORD_NOT_FOUND, 404);
        }

        if (existing.isDefault === 1) {
            throw new CustomError(QUOTATION_SCOPE_OF_WORK_VALIDATION_MESSAGES.CANNOT_DELETE_DEFAULT, 400);
        }

        const success = await this.repository.softDelete(tenantUid, uid, deletedBy);
        if (!success) {
            throw new CustomError("Failed to delete quotation scope of work", 500);
        }
    }

    async restore(tenantUid: string, uid: string, updatedBy: string): Promise<void> {
        const success = await this.repository.restore(tenantUid, uid, updatedBy);
        if (!success) {
            throw new CustomError(QUOTATION_SCOPE_OF_WORK_VALIDATION_MESSAGES.RECORD_NOT_FOUND, 404);
        }
    }
}

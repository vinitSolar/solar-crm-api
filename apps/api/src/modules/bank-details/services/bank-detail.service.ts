import { BankDetailRepository } from "../repositories/bank-detail.repository.js";
import type { IBankDetailSafe, ICreateBankDetail, IUpdateBankDetail } from "../interfaces/bank-detail.interface.js";
import { toBankDetailSafe } from "../dto/bank-detail.dto.js";
import { CustomError } from "../../../middlewares/error.middleware.js";
import { safeCacheGet, safeCacheSet, safeCacheDelPattern } from "@packages/redis/index.js";

export class BankDetailService {
    private readonly repository: BankDetailRepository;

    constructor(repository: BankDetailRepository) {
        this.repository = repository;
    }

    async createBankDetail(tenantUid: string, data: ICreateBankDetail, createdBy: string): Promise<IBankDetailSafe> {
        const isHeadOffice = await this.repository.isHeadOffice(tenantUid);
        if (!isHeadOffice) {
            throw new CustomError("Only head office can manage bank details", 403);
        }

        const existing = await this.repository.getAll(tenantUid);
        if (existing.length >= 1) {
            throw new CustomError("Bank details already exist for this tenant", 409);
        }

        const result = await this.repository.create(tenantUid, data, createdBy);
        await safeCacheDelPattern(`cache:bank-details:*:${tenantUid}*`);
        return toBankDetailSafe(result);
    }

    async getDefaultBankDetail(tenantUid: string): Promise<IBankDetailSafe | null> {
        const cacheKey = `cache:bank-details:default:${tenantUid}`;
        const cached = await safeCacheGet<IBankDetailSafe>(cacheKey);
        if (cached) {
            return cached;
        }

        const result = await this.repository.getDefault(tenantUid);
        if (!result) return null;
        const safe = toBankDetailSafe(result);
        await safeCacheSet(cacheKey, safe, 86400); // 24 hours
        return safe;
    }
    
    async getAllBankDetails(tenantUid: string): Promise<IBankDetailSafe[]> {
        const cacheKey = `cache:bank-details:all:${tenantUid}`;
        const cached = await safeCacheGet<IBankDetailSafe[]>(cacheKey);
        if (cached) {
            return cached;
        }

        const result = await this.repository.getAll(tenantUid);
        const safeList = result.map(toBankDetailSafe);
        await safeCacheSet(cacheKey, safeList, 86400); // 24 hours
        return safeList;
    }

    async updateBankDetail(uid: string, tenantUid: string, data: IUpdateBankDetail, updatedBy: string): Promise<IBankDetailSafe | null> {
        const isHeadOffice = await this.repository.isHeadOffice(tenantUid);
        if (!isHeadOffice) {
            throw new CustomError("Only head office can manage bank details", 403);
        }

        const result = await this.repository.update(tenantUid, uid, data, updatedBy);
        if (!result) return null;

        await safeCacheDelPattern(`cache:bank-details:*:${tenantUid}*`);
        return toBankDetailSafe(result);
    }

    async deleteBankDetail(uid: string, tenantUid: string, deletedBy: string): Promise<boolean> {
        const isHeadOffice = await this.repository.isHeadOffice(tenantUid);
        if (!isHeadOffice) {
            throw new CustomError("Only head office can manage bank details", 403);
        }

        const success = await this.repository.softDelete(tenantUid, uid, deletedBy);
        if (success) {
            await safeCacheDelPattern(`cache:bank-details:*:${tenantUid}*`);
        }
        return success;
    }
}

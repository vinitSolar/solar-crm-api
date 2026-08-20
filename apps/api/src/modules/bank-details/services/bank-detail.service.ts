import { BankDetailRepository } from "../repositories/bank-detail.repository.js";
import type { IBankDetailSafe, ICreateBankDetail, IUpdateBankDetail } from "../interfaces/bank-detail.interface.js";
import { toBankDetailSafe } from "../dto/bank-detail.dto.js";

export class BankDetailService {
    private readonly repository: BankDetailRepository;

    constructor(repository: BankDetailRepository) {
        this.repository = repository;
    }

    async createBankDetail(tenantUid: string, data: ICreateBankDetail, createdBy: string): Promise<IBankDetailSafe> {
        const result = await this.repository.create(tenantUid, data, createdBy);
        return toBankDetailSafe(result);
    }

    async getDefaultBankDetail(tenantUid: string): Promise<IBankDetailSafe | null> {
        const result = await this.repository.getDefault(tenantUid);
        if (!result) return null;
        return toBankDetailSafe(result);
    }
    
    async getAllBankDetails(tenantUid: string): Promise<IBankDetailSafe[]> {
        const result = await this.repository.getAll(tenantUid);
        return result.map(toBankDetailSafe);
    }

    async updateBankDetail(uid: string, tenantUid: string, data: IUpdateBankDetail, updatedBy: string): Promise<IBankDetailSafe | null> {
        const result = await this.repository.update(tenantUid, uid, data, updatedBy);
        if (!result) return null;
        return toBankDetailSafe(result);
    }

    async deleteBankDetail(uid: string, tenantUid: string, deletedBy: string): Promise<boolean> {
        return await this.repository.softDelete(tenantUid, uid, deletedBy);
    }
}

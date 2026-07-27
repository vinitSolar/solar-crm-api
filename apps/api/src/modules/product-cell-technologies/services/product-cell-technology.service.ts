import { ProductCellTechnologyRepository } from "../repositories/product-cell-technology.repository.js";
import type { ICreateProductCellTechnology, IUpdateProductCellTechnology, IProductCellTechnology, IPaginatedResponse } from "../interfaces/product-cell-technology.interface.js";
import { ProductCellTechnologyDto } from "../dto/product-cell-technology.dto.js";
import { CustomError } from "../../../middlewares/error.middleware.js";
import { PRODUCT_CELL_TECHNOLOGY_MESSAGES } from "../constants/messages.js";
import { AuditLogRepository } from "../../audit-logs/repositories/audit-logs.repository.js";
import { AuditLogService } from "../../audit-logs/services/audit-logs.service.js";
import pool from "@packages/connection.js";

export class ProductCellTechnologyService {
    private readonly repository: ProductCellTechnologyRepository;
    private readonly auditLogService: AuditLogService;

    constructor(repository: ProductCellTechnologyRepository) {
        this.repository = repository;
        this.auditLogService = new AuditLogService(new AuditLogRepository(pool));
    }

    async create(data: ICreateProductCellTechnology, userUid: string, ipAddress?: string): Promise<ProductCellTechnologyDto> {
        const existing = await this.repository.findByName(data.name);
        if (existing) {
            throw new CustomError(PRODUCT_CELL_TECHNOLOGY_MESSAGES.DUPLICATE_NAME, 400);
        }

        const created = await this.repository.create(data, userUid);
        
        await this.auditLogService.log({
            tenantUid: "SYSTEM",
            module: "product_cell_technology",
            recordUid: created.uid,
            action: "CREATE",
            message: `Created product cell technology ${created.name}`,
            metadata: { created_data: data },
            createdBy: userUid,
            ipAddress
        });

        return ProductCellTechnologyDto.fromEntity(created);
    }

    async update(uid: string, data: IUpdateProductCellTechnology, userUid: string, ipAddress?: string): Promise<ProductCellTechnologyDto> {
        const existing = await this.repository.findById(uid);
        if (!existing || existing.isDeleted === 1) {
            throw new CustomError(PRODUCT_CELL_TECHNOLOGY_MESSAGES.NOT_FOUND, 404);
        }

        if (data.name && data.name !== existing.name) {
            const nameCheck = await this.repository.findByName(data.name);
            if (nameCheck && nameCheck.uid !== uid) {
                throw new CustomError(PRODUCT_CELL_TECHNOLOGY_MESSAGES.DUPLICATE_NAME, 400);
            }
        }

        const updated = await this.repository.update(uid, data, userUid);

        await this.auditLogService.log({
            tenantUid: "SYSTEM",
            module: "product_cell_technology",
            recordUid: updated.uid,
            action: "UPDATE",
            message: `Updated product cell technology ${updated.name}`,
            metadata: { previous_data: existing, updated_data: data },
            createdBy: userUid,
            ipAddress
        });

        return ProductCellTechnologyDto.fromEntity(updated);
    }

    async delete(uid: string, userUid: string, ipAddress?: string): Promise<void> {
        const existing = await this.repository.findById(uid);
        if (!existing || existing.isDeleted === 1) {
            throw new CustomError(PRODUCT_CELL_TECHNOLOGY_MESSAGES.NOT_FOUND, 404);
        }

        const inUse = await this.repository.checkInUse(uid);
        if (inUse) {
            throw new CustomError(PRODUCT_CELL_TECHNOLOGY_MESSAGES.IN_USE, 400);
        }

        await this.repository.delete(uid, userUid);

        await this.auditLogService.log({
            tenantUid: "SYSTEM",
            module: "product_cell_technology",
            recordUid: uid,
            action: "DELETE",
            message: `Deleted product cell technology ${existing.name}`,
            metadata: { deleted_data: existing },
            createdBy: userUid,
            ipAddress
        });
    }

    async getDetails(uid: string): Promise<ProductCellTechnologyDto> {
        const existing = await this.repository.findById(uid);
        if (!existing || existing.isDeleted === 1) {
            throw new CustomError(PRODUCT_CELL_TECHNOLOGY_MESSAGES.NOT_FOUND, 404);
        }
        return ProductCellTechnologyDto.fromEntity(existing);
    }

    async list(page: number, limit: number, search?: string, status: "active" | "deleted" | "all" = "active"): Promise<IPaginatedResponse<ProductCellTechnologyDto>> {
        const result = await this.repository.list(page, limit, search, status);
        return {
            data: ProductCellTechnologyDto.fromEntities(result.data),
            meta: result.meta,
        };
    }

    async findAll(status: "active" | "deleted" | "all" = "active"): Promise<ProductCellTechnologyDto[]> {
        const result = await this.repository.findAll(status);
        return ProductCellTechnologyDto.fromEntities(result);
    }
}

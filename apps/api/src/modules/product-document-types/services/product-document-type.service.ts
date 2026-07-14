import type { PoolClient } from "pg";
import type { ProductDocumentTypeRepository } from "../repositories/product-document-type.repository.js";
import { toProductDocumentTypeDropdown, toProductDocumentTypeSafe } from "../dto/product-document-type.dto.js";
import type { 
    IProductDocumentTypeDropdown, 
    IProductDocumentTypeSafe, 
    ICreateProductDocumentType, 
    IUpdateProductDocumentType 
} from "../interfaces/product-document-type.interface.js";
import { CustomError } from "../../../middlewares/error.middleware.js";
import { logger } from "@packages/logger/index.js";

export class ProductDocumentTypeService {
    private readonly repository: ProductDocumentTypeRepository;

    constructor(repository: ProductDocumentTypeRepository) {
        this.repository = repository;
    }

    async createDefaultDocumentTypes(tenantUid: string, createdBy: string, client?: PoolClient): Promise<void> {
        logger.info("ProductDocumentTypeService.createDefaultDocumentTypes", { tenantUid });

        const defaults: ICreateProductDocumentType[] = [
            {
                name: "Datasheet",
                description: "Technical specification datasheet for the product",
                allowedExtensions: "pdf,doc,docx",
                allowMultiple: 0,
                isRequired: 0,
            },
            {
                name: "Warranty Document",
                description: "Warranty terms and guidelines",
                allowedExtensions: "pdf,jpg,jpeg,png",
                allowMultiple: 0,
                isRequired: 0,
            }
        ];

        for (const type of defaults) {
            const existing = await this.repository.findByTenantAndName(tenantUid, type.name, client);
            if (!existing) {
                await this.repository.create(tenantUid, type, createdBy, client);
            }
        }
    }

    async createProductDocumentType(tenantUid: string, data: ICreateProductDocumentType, createdBy: string): Promise<IProductDocumentTypeSafe> {
        const existing = await this.repository.findByTenantAndName(tenantUid, data.name);
        if (existing) {
            throw new CustomError("Product document type name already exists", 400);
        }

        const type = await this.repository.create(tenantUid, data, createdBy);
        return toProductDocumentTypeSafe(type);
    }

    async getProductDocumentTypeByUid(tenantUid: string, uid: string): Promise<IProductDocumentTypeSafe> {
        const type = await this.repository.getByUid(tenantUid, uid);
        if (!type) {
            throw new CustomError("Product document type not found", 404);
        }
        return toProductDocumentTypeSafe(type);
    }

    async getPaginatedProductDocumentTypes(tenantUid: string, query: { page?: number; limit?: number; search?: string; status?: string }) {
        const page = query.page || 1;
        const limit = query.limit || 10;
        const { total, rows } = await this.repository.getPaginated(tenantUid, page, limit, query.search, query.status);
        return {
            data: rows.map(toProductDocumentTypeSafe),
            total,
            totalPages: Math.ceil(total / limit),
        };
    }

    async getAllProductDocumentTypes(tenantUid: string, status?: string): Promise<IProductDocumentTypeSafe[]> {
        const types = await this.repository.getAll(tenantUid, status);
        return types.map(toProductDocumentTypeSafe);
    }

    async getDropdownTypes(tenantUid: string): Promise<IProductDocumentTypeDropdown[]> {
        const types = await this.repository.findAllActive(tenantUid);
        return types.map(toProductDocumentTypeDropdown);
    }

    async updateProductDocumentType(tenantUid: string, uid: string, data: IUpdateProductDocumentType, updatedBy: string): Promise<IProductDocumentTypeSafe> {
        const existing = await this.repository.getByUid(tenantUid, uid);
        if (!existing) {
            throw new CustomError("Product document type not found", 404);
        }

        if (data.name && data.name !== existing.name) {
            const duplicate = await this.repository.findByTenantAndName(tenantUid, data.name);
            if (duplicate) {
                throw new CustomError("Product document type name already exists", 400);
            }
        }

        const updated = await this.repository.update(tenantUid, uid, data, updatedBy);
        return toProductDocumentTypeSafe(updated);
    }

    async deleteProductDocumentType(tenantUid: string, uid: string, deletedBy: string): Promise<void> {
        const success = await this.repository.softDelete(tenantUid, uid, deletedBy);
        if (!success) {
            throw new CustomError("Product document type not found or already deleted", 404);
        }
    }

    async restoreProductDocumentType(tenantUid: string, uid: string, updatedBy: string): Promise<void> {
        const success = await this.repository.restore(tenantUid, uid, updatedBy);
        if (!success) {
            throw new CustomError("Product document type not found or not deleted", 404);
        }
    }
}

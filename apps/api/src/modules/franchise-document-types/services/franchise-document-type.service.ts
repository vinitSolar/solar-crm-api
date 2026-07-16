import type { PoolClient } from "pg";
import type { FranchiseDocumentTypeRepository } from "../repositories/franchise-document-type.repository.js";
import {
    toFranchiseDocumentTypeDropdown,
    toFranchiseDocumentTypeSafe,
} from "../dto/franchise-document-type.dto.js";
import type {
    IFranchiseDocumentTypeDropdown,
    IFranchiseDocumentTypeSafe,
    ICreateFranchiseDocumentType,
    IUpdateFranchiseDocumentType,
} from "../interfaces/franchise-document-type.interface.js";
import { FRANCHISE_DOCUMENT_TYPE_MESSAGES } from "../constants/franchise-document-type.constants.js";
import { CustomError } from "../../../middlewares/error.middleware.js";
import { logger } from "@packages/logger/index.js";

const DEFAULT_FRANCHISE_DOCUMENT_TYPES: ICreateFranchiseDocumentType[] = [
    { name: "GST Certificate", description: "GST registration certificate", allowMultiple: 0, isRequired: 1, sortOrder: 1 },
    { name: "PAN Card", description: "PAN card of the business", allowMultiple: 0, isRequired: 1, sortOrder: 2 },
    { name: "CIN Certificate", description: "Certificate of Incorporation", allowMultiple: 0, isRequired: 0, sortOrder: 3 },
    { name: "MSME Certificate", description: "MSME/Udyam registration certificate", allowMultiple: 0, isRequired: 0, sortOrder: 4 },
    { name: "Trade License", description: "Trade license issued by local authority", allowMultiple: 0, isRequired: 0, sortOrder: 5 },
    { name: "Shop & Establishment Certificate", description: "Shop and establishment registration", allowMultiple: 0, isRequired: 0, sortOrder: 6 },
    { name: "Electricity Bill", description: "Recent electricity bill for office premises", allowMultiple: 0, isRequired: 0, sortOrder: 7 },
];

export class FranchiseDocumentTypeService {
    private readonly repository: FranchiseDocumentTypeRepository;

    constructor(repository: FranchiseDocumentTypeRepository) {
        this.repository = repository;
    }

    async createDefaultDocumentTypes(tenantUid: string, createdBy: string, client?: PoolClient): Promise<void> {
        logger.info("FranchiseDocumentTypeService.createDefaultDocumentTypes", { tenantUid });

        for (const type of DEFAULT_FRANCHISE_DOCUMENT_TYPES) {
            const existing = await this.repository.findByTenantAndName(tenantUid, type.name, client);
            if (!existing) {
                await this.repository.create(tenantUid, type, createdBy, client);
            }
        }
    }

    async createFranchiseDocumentType(
        tenantUid: string,
        data: ICreateFranchiseDocumentType,
        createdBy: string
    ): Promise<IFranchiseDocumentTypeSafe> {
        const existing = await this.repository.findByTenantAndName(tenantUid, data.name);
        if (existing) {
            throw new CustomError(FRANCHISE_DOCUMENT_TYPE_MESSAGES.NAME_EXISTS, 400);
        }

        const type = await this.repository.create(tenantUid, data, createdBy);
        return toFranchiseDocumentTypeSafe(type);
    }

    async getFranchiseDocumentTypeByUid(tenantUid: string, uid: string): Promise<IFranchiseDocumentTypeSafe> {
        const type = await this.repository.getByUid(tenantUid, uid);
        if (!type) {
            throw new CustomError(FRANCHISE_DOCUMENT_TYPE_MESSAGES.NOT_FOUND, 404);
        }
        return toFranchiseDocumentTypeSafe(type);
    }

    async getPaginatedFranchiseDocumentTypes(
        tenantUid: string,
        query: { page?: number; limit?: number; search?: string; status?: string }
    ) {
        const page = query.page || 1;
        const limit = query.limit || 10;
        const { total, rows } = await this.repository.getPaginated(tenantUid, page, limit, query.search, query.status);
        return {
            data: rows.map(toFranchiseDocumentTypeSafe),
            total,
            totalPages: Math.ceil(total / limit),
        };
    }

    async getAllFranchiseDocumentTypes(tenantUid: string, status?: string): Promise<IFranchiseDocumentTypeSafe[]> {
        const types = await this.repository.getAll(tenantUid, status);
        return types.map(toFranchiseDocumentTypeSafe);
    }

    async getDropdownTypes(tenantUid: string): Promise<IFranchiseDocumentTypeDropdown[]> {
        const types = await this.repository.findAllActive(tenantUid);
        return types.map(toFranchiseDocumentTypeDropdown);
    }

    async updateFranchiseDocumentType(
        tenantUid: string,
        uid: string,
        data: IUpdateFranchiseDocumentType,
        updatedBy: string
    ): Promise<IFranchiseDocumentTypeSafe> {
        const existing = await this.repository.getByUid(tenantUid, uid);
        if (!existing) {
            throw new CustomError(FRANCHISE_DOCUMENT_TYPE_MESSAGES.NOT_FOUND, 404);
        }

        if (data.name && data.name !== existing.name) {
            const duplicate = await this.repository.findByTenantAndName(tenantUid, data.name);
            if (duplicate) {
                throw new CustomError(FRANCHISE_DOCUMENT_TYPE_MESSAGES.NAME_EXISTS, 400);
            }
        }

        const updated = await this.repository.update(tenantUid, uid, data, updatedBy);
        return toFranchiseDocumentTypeSafe(updated);
    }

    async deleteFranchiseDocumentType(tenantUid: string, uid: string, deletedBy: string): Promise<void> {
        const success = await this.repository.softDelete(tenantUid, uid, deletedBy);
        if (!success) {
            throw new CustomError(FRANCHISE_DOCUMENT_TYPE_MESSAGES.ALREADY_DELETED, 404);
        }
    }

    async restoreFranchiseDocumentType(tenantUid: string, uid: string, updatedBy: string): Promise<void> {
        const success = await this.repository.restore(tenantUid, uid, updatedBy);
        if (!success) {
            throw new CustomError(FRANCHISE_DOCUMENT_TYPE_MESSAGES.NOT_DELETED, 404);
        }
    }
}

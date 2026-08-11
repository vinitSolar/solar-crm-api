import { CustomError } from "../../../middlewares/error.middleware.js";
import { logger } from "@packages/logger/index.js";
import type { FranchiseDocumentTypeRepository } from "../repositories/franchise-document-type.repository.js";
import type { IFranchiseDocumentType } from "../interfaces/franchise.interface.js";

export class FranchiseDocumentTypeService {
    private readonly repository: FranchiseDocumentTypeRepository;

    constructor(repository: FranchiseDocumentTypeRepository) {
        this.repository = repository;
    }

    async createDocumentType(
        tenantUid: string,
        data: { name: string; description?: string; allowMultiple?: number; isRequired?: number; sortOrder?: number },
        createdBy: string
    ): Promise<IFranchiseDocumentType> {
        logger.info("FranchiseDocumentTypeService.createDocumentType", { tenantUid, name: data.name });

        const exists = await this.repository.checkNameExists(tenantUid, data.name);
        if (exists) {
            throw new CustomError("Document type with this name already exists", 400);
        }

        return this.repository.create(tenantUid, data, createdBy);
    }

    async getAllDocumentTypes(tenantUid: string, status?: string): Promise<IFranchiseDocumentType[]> {
        logger.info("FranchiseDocumentTypeService.getAllDocumentTypes", { tenantUid, status });
        return this.repository.getAll(tenantUid, status);
    }

    async getPaginatedDocumentTypes(
        tenantUid: string,
        page: number,
        limit: number,
        search?: string,
        status?: string
    ) {
        logger.info("FranchiseDocumentTypeService.getPaginatedDocumentTypes", { tenantUid, page, limit, search, status });
        return this.repository.getPaginated(tenantUid, page, limit, search, status);
    }

    async getDocumentTypeByUid(tenantUid: string, uid: string): Promise<IFranchiseDocumentType> {
        logger.info("FranchiseDocumentTypeService.getDocumentTypeByUid", { tenantUid, uid });
        const docType = await this.repository.getByUid(uid);
        if (!docType || docType.tenantUid !== tenantUid) {
            throw new CustomError("Document type not found", 404);
        }
        return docType;
    }

    async updateDocumentType(
        tenantUid: string,
        uid: string,
        data: { name?: string; description?: string; allowMultiple?: number; isRequired?: number; sortOrder?: number; isActive?: number },
        updatedBy: string
    ): Promise<IFranchiseDocumentType> {
        logger.info("FranchiseDocumentTypeService.updateDocumentType", { tenantUid, uid });

        if (data.name) {
            const existing = await this.repository.getByUid(uid);
            if (existing && existing.name !== data.name) {
                const nameExists = await this.repository.checkNameExists(tenantUid, data.name);
                if (nameExists) {
                    throw new CustomError("Document type with this name already exists", 400);
                }
            }
        }

        const updated = await this.repository.update(uid, tenantUid, data, updatedBy);
        if (!updated) {
            throw new CustomError("Document type not found or update failed", 404);
        }
        return updated;
    }

    async deleteDocumentType(tenantUid: string, uid: string, deletedBy: string): Promise<void> {
        logger.info("FranchiseDocumentTypeService.deleteDocumentType", { tenantUid, uid });
        const success = await this.repository.softDelete(uid, tenantUid, deletedBy);
        if (!success) {
            throw new CustomError("Document type not found or already deleted", 404);
        }
    }

    async restoreDocumentType(tenantUid: string, uid: string, updatedBy: string): Promise<void> {
        logger.info("FranchiseDocumentTypeService.restoreDocumentType", { tenantUid, uid });
        const success = await this.repository.restore(uid, tenantUid, updatedBy);
        if (!success) {
            throw new CustomError("Document type not found or not deleted", 404);
        }
    }
}

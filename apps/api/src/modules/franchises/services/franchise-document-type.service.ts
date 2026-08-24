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
        data: { name: string; description?: string; allowMultiple?: number; isRequired?: number; sortOrder?: number },
        createdBy: string
    ): Promise<IFranchiseDocumentType> {
        logger.info("FranchiseDocumentTypeService.createDocumentType", { name: data.name });

        const exists = await this.repository.checkNameExists(data.name);
        if (exists) {
            throw new CustomError("Document type with this name already exists", 400);
        }

        return this.repository.create(data, createdBy);
    }

    async getAllDocumentTypes(status?: string): Promise<IFranchiseDocumentType[]> {
        logger.info("FranchiseDocumentTypeService.getAllDocumentTypes", { status });
        return this.repository.getAll(status);
    }

    async getPaginatedDocumentTypes(
        page: number,
        limit: number,
        search?: string,
        status?: string
    ) {
        logger.info("FranchiseDocumentTypeService.getPaginatedDocumentTypes", { page, limit, search, status });
        return this.repository.getPaginated(page, limit, search, status);
    }

    async getDocumentTypeByUid(uid: string): Promise<IFranchiseDocumentType> {
        logger.info("FranchiseDocumentTypeService.getDocumentTypeByUid", { uid });
        const docType = await this.repository.getByUid(uid);
        if (!docType) {
            throw new CustomError("Document type not found", 404);
        }
        return docType;
    }

    async updateDocumentType(
        uid: string,
        data: { name?: string; description?: string; allowMultiple?: number; isRequired?: number; sortOrder?: number; isActive?: number },
        updatedBy: string
    ): Promise<IFranchiseDocumentType> {
        logger.info("FranchiseDocumentTypeService.updateDocumentType", { uid });

        if (data.name) {
            const existing = await this.repository.getByUid(uid);
            if (existing && existing.name !== data.name) {
                const nameExists = await this.repository.checkNameExists(data.name);
                if (nameExists) {
                    throw new CustomError("Document type with this name already exists", 400);
                }
            }
        }

        const updated = await this.repository.update(uid, data, updatedBy);
        if (!updated) {
            throw new CustomError("Document type not found or update failed", 404);
        }
        return updated;
    }

    async deleteDocumentType(uid: string, deletedBy: string): Promise<void> {
        logger.info("FranchiseDocumentTypeService.deleteDocumentType", { uid });
        const success = await this.repository.softDelete(uid, deletedBy);
        if (!success) {
            throw new CustomError("Document type not found or already deleted", 404);
        }
    }

    async restoreDocumentType(uid: string, updatedBy: string): Promise<void> {
        logger.info("FranchiseDocumentTypeService.restoreDocumentType", { uid });
        const success = await this.repository.restore(uid, updatedBy);
        if (!success) {
            throw new CustomError("Document type not found or not deleted", 404);
        }
    }
}

import type { PoolClient } from "pg";
import type { SurveyDocumentTypeRepository } from "../repositories/survey-document-type.repository.js";
import type {
    ICreateSurveyDocumentType,
    IUpdateSurveyDocumentType,
    ISurveyDocumentTypeSafe,
    ISurveyDocumentPaginationQuery,
    IPaginatedResponse,
} from "../interfaces/survey-documents.interface.js";
import { toSurveyDocumentTypeSafe } from "../dto/survey-documents.dto.js";
import { SURVEY_DOCUMENT_TYPE_MESSAGES } from "../constants/survey-documents.constants.js";
import { CustomError } from "../../../middlewares/error.middleware.js";
import { logger } from "@packages/logger/index.js";

export class SurveyDocumentTypeService {
    private readonly repository: SurveyDocumentTypeRepository;

    constructor(repository: SurveyDocumentTypeRepository) {
        this.repository = repository;
    }

    async createDocumentType(tenantUid: string, data: ICreateSurveyDocumentType, createdBy: string): Promise<ISurveyDocumentTypeSafe> {
        logger.info("SurveyDocumentTypeService.createDocumentType", { tenantUid, name: data.name });
        const type = await this.repository.create(tenantUid, data, 0, createdBy);
        return toSurveyDocumentTypeSafe(type);
    }

    async createDefaultDocumentTypes(tenantUid: string, createdBy: string, client?: PoolClient): Promise<void> {
        logger.info("SurveyDocumentTypeService.createDefaultDocumentTypes", { tenantUid });

        const defaultTypes: ICreateSurveyDocumentType[] = [
            { name: "Roof Photos", description: "Photos of the roof where panels will be installed", isRequired: 1, allowMultiple: 1, sortOrder: 10 },
            { name: "Electricity Meter", description: "Photo of the current electricity meter", isRequired: 1, allowMultiple: 1, sortOrder: 20 },
            { name: "Distribution Board", description: "Photo of the main distribution board", isRequired: 1, allowMultiple: 1, sortOrder: 30 },
            { name: "Inverter Installation Area", description: "Area proposed for inverter installation", isRequired: 1, allowMultiple: 1, sortOrder: 60 }
        ];

        for (const type of defaultTypes) {
            await this.repository.create(tenantUid, type, 1, createdBy, client);
        }
    }

    async getPaginatedDocumentTypes(tenantUid: string, query: ISurveyDocumentPaginationQuery): Promise<IPaginatedResponse<ISurveyDocumentTypeSafe>> {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = query.limit && query.limit > 0 ? query.limit : 10;

        const result = await this.repository.getPaginated(tenantUid, page, limit, query.search, query.status);

        return {
            data: result.rows.map(toSurveyDocumentTypeSafe),
            meta: {
                total: result.total,
                page,
                limit,
                totalPages: Math.ceil(result.total / limit),
            },
        };
    }

    async getAllDocumentTypes(tenantUid: string, status?: string): Promise<ISurveyDocumentTypeSafe[]> {
        const types = await this.repository.getAll(tenantUid, status);
        return types.map(toSurveyDocumentTypeSafe);
    }

    async getDocumentTypeByUid(tenantUid: string, uid: string): Promise<ISurveyDocumentTypeSafe> {
        const type = await this.repository.getByUid(tenantUid, uid);
        if (!type) {
            throw new CustomError(SURVEY_DOCUMENT_TYPE_MESSAGES.NOT_FOUND, 404);
        }
        return toSurveyDocumentTypeSafe(type);
    }

    async updateDocumentType(tenantUid: string, uid: string, data: IUpdateSurveyDocumentType, updatedBy: string): Promise<ISurveyDocumentTypeSafe> {
        const existing = await this.repository.getByUid(tenantUid, uid);
        if (!existing) {
            throw new CustomError(SURVEY_DOCUMENT_TYPE_MESSAGES.NOT_FOUND, 404);
        }

        const type = await this.repository.update(tenantUid, uid, data, updatedBy);
        return toSurveyDocumentTypeSafe(type);
    }

    async deleteDocumentType(tenantUid: string, uid: string, deletedBy: string): Promise<void> {
        const existing = await this.repository.getByUid(tenantUid, uid);
        if (!existing) {
            throw new CustomError(SURVEY_DOCUMENT_TYPE_MESSAGES.NOT_FOUND, 404);
        }

        if (existing.isSystem === 1) {
            throw new CustomError(SURVEY_DOCUMENT_TYPE_MESSAGES.CANNOT_DELETE_SYSTEM_TYPE, 400);
        }

        const success = await this.repository.softDelete(tenantUid, uid, deletedBy);
        if (!success) {
            throw new CustomError(SURVEY_DOCUMENT_TYPE_MESSAGES.DELETE_FAILED, 500);
        }
    }
}

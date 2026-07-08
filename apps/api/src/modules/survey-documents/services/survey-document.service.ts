import type { Pool, PoolClient } from "pg";
import type { SurveyDocumentRepository } from "../repositories/survey-document.repository.js";
import type { SurveyDocumentTypeRepository } from "../repositories/survey-document-type.repository.js";
import type { SiteSurveyRepository } from "../../site-surveys/repositories/site-survey.repository.js";
import type { ISiteSurveyDocumentSafe, IGroupedSurveyDocuments } from "../interfaces/survey-documents.interface.js";
import { toSiteSurveyDocumentSafe, groupSurveyDocuments } from "../dto/survey-documents.dto.js";
import { SURVEY_DOCUMENT_MESSAGES } from "../constants/survey-documents.constants.js";
import { CustomError } from "../../../middlewares/error.middleware.js";
import { storageService } from "@packages/storage/index.js";
import { logger } from "@packages/logger/index.js";
import path from "path";

export class SurveyDocumentService {
    private readonly documentRepository: SurveyDocumentRepository;
    private readonly documentTypeRepository: SurveyDocumentTypeRepository;
    private readonly siteSurveyRepository: SiteSurveyRepository;
    private readonly pool: Pool;

    constructor(
        documentRepository: SurveyDocumentRepository,
        documentTypeRepository: SurveyDocumentTypeRepository,
        siteSurveyRepository: SiteSurveyRepository,
        pool: Pool
    ) {
        this.documentRepository = documentRepository;
        this.documentTypeRepository = documentTypeRepository;
        this.siteSurveyRepository = siteSurveyRepository;
        this.pool = pool;
    }

    async uploadDocuments(
        tenantUid: string,
        siteSurveyUid: string,
        documentTypeUid: string,
        remarks: string | undefined,
        files: Express.Multer.File[],
        createdBy: string
    ): Promise<IGroupedSurveyDocuments[]> {
        logger.info("SurveyDocumentService.uploadDocuments", { tenantUid, siteSurveyUid, documentTypeUid, filesCount: files.length });

        if (!files || files.length === 0) {
            throw new CustomError("No files provided", 400);
        }

        // 1. Verify Site Survey exists and belongs to the tenant
        const siteSurvey = await this.siteSurveyRepository.getByUid(tenantUid, siteSurveyUid);
        if (!siteSurvey) {
            throw new CustomError(SURVEY_DOCUMENT_MESSAGES.SURVEY_NOT_FOUND, 404);
        }

        // 2. Verify Document Type exists and belongs to the tenant
        const docType = await this.documentTypeRepository.getByUid(tenantUid, documentTypeUid);
        if (!docType) {
            throw new CustomError("Survey document type not found", 404);
        }

        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");

            // Fetch tenant code
            const tenantResult = await client.query("SELECT code FROM tenants WHERE uid = $1", [tenantUid]);
            const tenantCode = tenantResult.rows[0]?.code || "unknown";
            const basePath = `franchises/${tenantCode}_${tenantUid}/leads/surveydoc/${siteSurvey.leadUid}`;

            // 3. Handle `allow_multiple` logic
            if (docType.allowMultiple === 0) {
                if (files.length > 1) {
                    throw new CustomError(SURVEY_DOCUMENT_MESSAGES.MULTIPLE_NOT_ALLOWED, 400);
                }

                // If only single file is allowed, soft-delete existing active documents of this type
                const existingDocs = await this.documentRepository.getActiveDocumentsByType(tenantUid, siteSurveyUid, documentTypeUid);
                if (existingDocs.length > 0) {
                    await this.documentRepository.softDeleteMultiple(tenantUid, existingDocs.map(d => d.uid), createdBy, client);
                }
            }

            const uploadedDocs: ISiteSurveyDocumentSafe[] = [];

            // 4. Upload and Save to DB
            for (const file of files) {
                // Upload to StorageService
                const fileUrl = await storageService.uploadFile(
                    file.buffer,
                    file.originalname,
                    file.mimetype,
                    basePath
                );

                // Assuming storageService uses UUIDs for file names internally. We can just use the url's basename as filename
                const fileName = path.basename(fileUrl) || file.originalname;

                // Save to DB
                const doc = await this.documentRepository.create(
                    tenantUid,
                    siteSurveyUid,
                    documentTypeUid,
                    file.originalname,
                    fileName,
                    fileUrl,
                    file.mimetype,
                    file.size,
                    remarks,
                    createdBy,
                    client
                );
                
                // Add documentTypeName manually for the response
                doc.documentTypeName = docType.name;

                uploadedDocs.push(toSiteSurveyDocumentSafe(doc));
            }

            await client.query("COMMIT");
            return groupSurveyDocuments(uploadedDocs);
        } catch (error) {
            await client.query("ROLLBACK");
            logger.error("SurveyDocumentService.uploadDocuments failed", { error });
            if (error instanceof CustomError) throw error;
            throw new CustomError(SURVEY_DOCUMENT_MESSAGES.UPLOAD_FAILED, 500);
        } finally {
            client.release();
        }
    }

    async getDocumentsBySurveyUid(tenantUid: string, siteSurveyUid: string): Promise<IGroupedSurveyDocuments[]> {
        const docs = await this.documentRepository.getBySurveyUid(tenantUid, siteSurveyUid);
        return groupSurveyDocuments(docs.map(toSiteSurveyDocumentSafe));
    }

    async deleteDocument(tenantUid: string, documentUid: string, deletedBy: string): Promise<void> {
        // Soft delete the document only, we don't delete the physical file per requirements
        const success = await this.documentRepository.softDelete(tenantUid, documentUid, deletedBy);
        if (!success) {
            throw new CustomError(SURVEY_DOCUMENT_MESSAGES.DELETE_FAILED, 500);
        }
    }
}

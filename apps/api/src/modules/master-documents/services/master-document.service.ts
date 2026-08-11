import type { Pool, PoolClient } from "pg";
import type { MasterDocumentRepository } from "../repositories/master-document.repository.js";
import type { DocumentAssociationRepository } from "../repositories/document-association.repository.js";
import type { MasterDocumentTypeRepository } from "../repositories/master-document-type.repository.js";
import type {
  IUploadDocumentRequest,
  ILinkDocumentRequest,
  IDocumentWithAssociations,
  IGroupedContextDocuments,
} from "../interfaces/master-documents.interface.js";
import {
  toMasterDocumentSafe,
  toDocumentAssociationSafe,
  groupContextDocuments,
} from "../dto/master-documents.dto.js";
import { MASTER_DOCUMENT_MESSAGES } from "../constants/master-documents.constants.js";
import { CustomError } from "../../../middlewares/error.middleware.js";
import { storageService } from "@packages/storage/index.js";
import { logger } from "@packages/logger/index.js";
import path from "path";

export class MasterDocumentService {
  private readonly documentRepository: MasterDocumentRepository;
  private readonly associationRepository: DocumentAssociationRepository;
  private readonly typeRepository: MasterDocumentTypeRepository;
  private readonly pool: Pool;

  constructor(
    documentRepository: MasterDocumentRepository,
    associationRepository: DocumentAssociationRepository,
    typeRepository: MasterDocumentTypeRepository,
    pool: Pool,
  ) {
    this.documentRepository = documentRepository;
    this.associationRepository = associationRepository;
    this.typeRepository = typeRepository;
    this.pool = pool;
  }

  async uploadAndAssociate(
    tenantUid: string,
    data: IUploadDocumentRequest,
    file: Express.Multer.File,
    createdBy: string,
  ): Promise<IDocumentWithAssociations> {
    logger.info("MasterDocumentService.uploadAndAssociate", {
      tenantUid,
      entityUid: data.entityUid,
      module: data.module,
    });

    if (!file) {
      throw new CustomError(MASTER_DOCUMENT_MESSAGES.NO_FILE, 400);
    }

    const docType = await this.typeRepository.getByUid(
      data.documentTypeUid,
      tenantUid,
    );
    if (!docType) {
      throw new CustomError("Document type not found", 404);
    }

    // Validate Entity and Context existence to prevent ghost records
    const isEntityValid = await this.validateExistence(
      data.entityType,
      data.entityUid,
      tenantUid,
    );
    if (!isEntityValid) {
      throw new CustomError(
        `Invalid entity reference: ${data.entityType} not found`,
        400,
      );
    }

    const isContextValid = await this.validateExistence(
      data.module,
      data.contextUid,
      tenantUid,
    );
    if (!isContextValid) {
      throw new CustomError(
        `Invalid context reference: ${data.module} not found`,
        400,
      );
    }

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      // Handle allow_multiple logic per entity type. If not allowed, mark existing versions as not latest.
      if (docType.allowMultiple === 0) {
        const existingDocs = await this.documentRepository.getByEntityAndType(
          tenantUid,
          data.entityType,
          data.entityUid,
          data.documentTypeUid,
          client,
        );
        for (const existing of existingDocs) {
          await this.documentRepository.markNotLatest(
            tenantUid,
            existing.uid,
            client,
          );
        }
      }

      // Define folder structure for physical file
      // E.g. master-vault/tenant_uid/entity_type/entity_uid
      const folder = `master-vault/${tenantUid}/${data.entityType}/${data.entityUid}`;

      const fileUrlResult = await storageService.uploadFileWithPath(
        file.buffer,
        file.originalname,
        file.mimetype,
        folder,
      );

      const fileUrl = fileUrlResult.url;
      const fileName = fileUrlResult.path || path.basename(fileUrl);

      // Create Master Document
      const document = await this.documentRepository.create(
        tenantUid,
        data.documentTypeUid,
        data.entityType,
        data.entityUid,
        file.originalname,
        fileName,
        fileUrl,
        file.mimetype,
        file.size,
        data.documentNumber,
        data.remarks,
        createdBy,
        client,
      );

      // Create Association
      const association = await this.associationRepository.create(
        tenantUid,
        document.uid,
        data.module,
        data.contextUid,
        data.remarks,
        createdBy,
        client,
      );

      await client.query("COMMIT");

      const safeDoc = toMasterDocumentSafe(document);
      safeDoc.documentTypeName = docType.name;
      safeDoc.documentTypeCategory = docType.category;

      return {
        ...safeDoc,
        associations: [toDocumentAssociationSafe(association)],
      };
    } catch (error) {
      await client.query("ROLLBACK");
      logger.error("MasterDocumentService.uploadAndAssociate failed", {
        error,
      });
      if (error instanceof CustomError) throw error;
      throw new CustomError(MASTER_DOCUMENT_MESSAGES.UPLOAD_FAILED, 500);
    } finally {
      client.release();
    }
  }

  async linkExisting(
    tenantUid: string,
    data: ILinkDocumentRequest,
    createdBy: string,
  ): Promise<IDocumentWithAssociations> {
    const document = await this.documentRepository.getByUid(
      tenantUid,
      data.masterDocumentUid,
    );
    if (!document) {
      throw new CustomError(MASTER_DOCUMENT_MESSAGES.NOT_FOUND, 404);
    }

    const isContextValid = await this.validateExistence(
      data.module,
      data.contextUid,
      tenantUid,
    );
    if (!isContextValid) {
      throw new CustomError(
        `Invalid context reference: ${data.module} not found`,
        400,
      );
    }

    const existingLink =
      await this.associationRepository.getByMasterDocumentAndContext(
        tenantUid,
        data.masterDocumentUid,
        data.module,
        data.contextUid,
      );
    if (existingLink) {
      throw new CustomError(MASTER_DOCUMENT_MESSAGES.ALREADY_LINKED, 400);
    }

    const association = await this.associationRepository.create(
      tenantUid,
      document.uid,
      data.module,
      data.contextUid,
      data.remarks,
      createdBy,
    );

    return {
      ...toMasterDocumentSafe(document),
      associations: [toDocumentAssociationSafe(association)],
    };
  }

  async getByContextGrouped(
    tenantUid: string,
    module: import("../interfaces/master-documents.interface.js").ModuleType,
    contextUid: string,
  ): Promise<IGroupedContextDocuments[]> {
    const docs = await this.associationRepository.getByContext(
      tenantUid,
      module,
      contextUid,
    );
    return groupContextDocuments(docs);
  }

  async getAvailableToLink(
    tenantUid: string,
    entityType: import("../interfaces/master-documents.interface.js").EntityType,
    entityUid: string,
    module: import("../interfaces/master-documents.interface.js").ModuleType,
    contextUid: string,
  ): Promise<
    import("../interfaces/master-documents.interface.js").IMasterDocumentSafe[]
  > {
    // 1. Get all documents for this entity
    const entityDocs = await this.documentRepository.getByEntity(
      tenantUid,
      entityType,
      entityUid,
    );

    // 2. Get all associations for this specific context
    const contextDocs = await this.associationRepository.getByContext(
      tenantUid,
      module,
      contextUid,
    );
    const linkedDocUids = new Set(contextDocs.map((d) => d.uid)); // md.uid is returned in getByContext

    // 3. Filter out the ones already linked
    const available = entityDocs.filter((d) => !linkedDocUids.has(d.uid));

    return available.map(toMasterDocumentSafe);
  }

  async unlinkDocument(
    tenantUid: string,
    associationUid: string,
    deletedBy: string,
  ): Promise<void> {
    const success = await this.associationRepository.softDelete(
      tenantUid,
      associationUid,
      deletedBy,
    );
    if (!success) {
      throw new CustomError(
        MASTER_DOCUMENT_MESSAGES.ASSOCIATION_NOT_FOUND,
        404,
      );
    }
  }

  async deleteMasterDocument(
    tenantUid: string,
    masterDocumentUid: string,
    deletedBy: string,
  ): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      // Soft delete the master document
      const success = await this.documentRepository.softDelete(
        tenantUid,
        masterDocumentUid,
        deletedBy,
        client,
      );
      if (!success) {
        throw new CustomError(MASTER_DOCUMENT_MESSAGES.NOT_FOUND, 404);
      }

      // Also delete all associations to avoid dangling links
      await this.associationRepository.softDeleteByMasterDocument(
        tenantUid,
        masterDocumentUid,
        deletedBy,
        client,
      );

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      logger.error("MasterDocumentService.deleteMasterDocument failed", {
        error,
      });
      throw new CustomError("Failed to delete master document", 500);
    } finally {
      client.release();
    }
  }

  private async validateExistence(
    typeOrModule: string,
    uid: string,
    tenantUid: string,
  ): Promise<boolean> {
    const tableMap: Record<string, string> = {
      lead: "leads",
      customer: "customers",
      franchise: "tenants",
      product: "products",
      site_survey: "site_surveys",
      subsidy_tracker: "subsidy_trackers",
      project: "projects",
    };

    const tableName = tableMap[typeOrModule];
    // If not mapped, allow it to pass to avoid breaking flows for unknown entities
    if (!tableName) return true;

    try {
      let query = "";
      let params: string[] = [];

      if (tableName === "tenants") {
        query = `SELECT 1 FROM tenants WHERE uid = $1 LIMIT 1`;
        params = [uid];
      } else {
        query = `SELECT 1 FROM ${tableName} WHERE uid = $1 AND tenant_uid = $2 AND is_deleted = 0 LIMIT 1`;
        params = [uid, tenantUid];
      }

      const result = await this.pool.query(query, params);
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      // If table/column doesn't exist, we fallback to true to not block the user
      logger.warn(
        `Failed to validate existence for ${typeOrModule} in ${tableName}`,
        { error },
      );
      return true;
    }
  }
}

import type { MasterDocumentTypeRepository } from "../repositories/master-document-type.repository.js";
import type { DocumentAssociationRepository } from "../repositories/document-association.repository.js";
import type { MasterDocumentRepository } from "../repositories/master-document.repository.js";
import type {
  IMasterDocumentTypeSafe,
  ICreateMasterDocumentType,
  IUpdateMasterDocumentType,
  IPaginationQuery,
  ModuleType,
  IContextDocument,
  IMasterDocumentSafe,
  EntityType,
} from "../interfaces/master-documents.interface.js";
import { toMasterDocumentTypeSafe } from "../dto/master-documents.dto.js";
import { MASTER_DOCUMENT_TYPE_MESSAGES } from "../constants/master-documents.constants.js";
import { CustomError } from "../../../middlewares/error.middleware.js";

export class MasterDocumentTypeService {
  private readonly repository: MasterDocumentTypeRepository;
  private readonly associationRepository?: DocumentAssociationRepository | undefined;
  private readonly documentRepository?: MasterDocumentRepository | undefined;

  constructor(
    repository: MasterDocumentTypeRepository,
    associationRepository?: DocumentAssociationRepository,
    documentRepository?: MasterDocumentRepository,
  ) {
    this.repository = repository;
    this.associationRepository = associationRepository;
    this.documentRepository = documentRepository;
  }

  async createDefaultDocumentTypes(
    tenantUid: string,
    createdBy: string,
  ): Promise<void> {
    // The default unified documents are now seeded globally (tenant_uid = NULL).
    // Every tenant automatically inherits them via MasterDocumentTypeRepository.
    // There is no need to duplicate them per tenant.
  }

  async create(
    tenantUid: string | null,
    data: ICreateMasterDocumentType,
    createdBy: string,
  ): Promise<IMasterDocumentTypeSafe> {
    // Prevent duplicate names within the same scope (tenant or global)
    const existing = await this.repository.getByName(data.name, tenantUid);
    if (existing) {
      throw new CustomError(MASTER_DOCUMENT_TYPE_MESSAGES.NAME_EXISTS, 400);
    }

    const type = await this.repository.create(tenantUid, data, 0, createdBy); // isSystem = 0 for user created
    return toMasterDocumentTypeSafe(type);
  }

  async getByUid(
    uid: string,
    tenantUid?: string | null,
  ): Promise<IMasterDocumentTypeSafe> {
    const type = await this.repository.getByUid(uid, tenantUid);
    if (!type) {
      throw new CustomError(MASTER_DOCUMENT_TYPE_MESSAGES.NOT_FOUND, 404);
    }
    return toMasterDocumentTypeSafe(type);
  }

  async getByModule(
    module: string,
    tenantUid?: string | null,
  ): Promise<IMasterDocumentTypeSafe[]> {
    const types = await this.repository.getByModule(module, tenantUid);
    return types.map(toMasterDocumentTypeSafe);
  }

  async getByModuleWithUploads(
    module: ModuleType,
    contextUid: string,
    tenantUid?: string | null,
  ): Promise<IMasterDocumentTypeSafe[]> {
    const types = await this.repository.getByModule(module, tenantUid);
    const data = types.map(toMasterDocumentTypeSafe);

    if (this.associationRepository && tenantUid) {
      const docs = await this.associationRepository.getByContext(
        tenantUid,
        module,
        contextUid,
      );

      const docsByType = new Map<string, IContextDocument[]>();
      for (const doc of docs) {
        if (!docsByType.has(doc.documentTypeUid)) {
          docsByType.set(doc.documentTypeUid, []);
        }
        docsByType.get(doc.documentTypeUid)!.push(doc);
      }

      for (const type of data) {
        type.files = docsByType.get(type.uid) || [];
        
        if (type.files.length > 0) {
          (type as any).fileUrl = type.files[0]?.fileUrl;
        }
      }
    }

    return data;
  }

  async getAll(
    tenantUid?: string | null,
    status?: string,
  ): Promise<IMasterDocumentTypeSafe[]> {
    const types = await this.repository.getAll(tenantUid, status);
    return types.map(toMasterDocumentTypeSafe);
  }

  async getPaginated(
    tenantUid: string | null,
    queryParams: IPaginationQuery & { module?: string },
  ) {
    const page = queryParams.page || 1;
    const limit = queryParams.limit || 10;

    const result = await this.repository.getPaginated(
      tenantUid,
      page,
      limit,
      queryParams.search,
      queryParams.status,
      queryParams.module,
      queryParams.category,
    );

    const data = result.rows.map(toMasterDocumentTypeSafe);

    // If both module and contextUid are provided, fetch the uploaded files for this context
    if (this.associationRepository && tenantUid && queryParams.module && queryParams.contextUid) {
      const docs = await this.associationRepository.getByContext(
        tenantUid,
        queryParams.module as ModuleType,
        queryParams.contextUid,
      );

      const docsByType = new Map<string, IContextDocument[]>();
      for (const doc of docs) {
        if (!docsByType.has(doc.documentTypeUid)) {
          docsByType.set(doc.documentTypeUid, []);
        }
        docsByType.get(doc.documentTypeUid)!.push(doc);
      }

      for (const type of data) {
        // If files is not yet an array, initialize it
        if (!type.files) {
          type.files = [];
        }
        type.files = [...type.files, ...(docsByType.get(type.uid) || [])];
        
        // Convenience field for frontend
        if (type.files.length > 0) {
          (type as any).fileUrl = type.files[0]?.fileUrl;
        }
      }
    }

    // If both entityType and entityUid are provided, fetch the uploaded files for this entity
    if (this.documentRepository && tenantUid && queryParams.entityType && queryParams.entityUid) {
      const entityDocs = await this.documentRepository.getByEntity(
        tenantUid,
        queryParams.entityType as EntityType,
        queryParams.entityUid,
      );

      const entityDocsByType = new Map<string, IMasterDocumentSafe[]>();
      for (const doc of entityDocs) {
        if (!entityDocsByType.has(doc.documentTypeUid)) {
          entityDocsByType.set(doc.documentTypeUid, []);
        }
        entityDocsByType.get(doc.documentTypeUid)!.push(doc);
      }

      for (const type of data) {
        // We can cast entity docs to IContextDocument since it has the required base fields
        // For UI purposes, returning them in `files` array is consistent
        const docsToAdd = (entityDocsByType.get(type.uid) || []) as IContextDocument[];
        
        if (!type.files) {
          type.files = [];
        }
        
        // Merge without duplicates (using uid)
        const existingUids = new Set(type.files.map(f => f.uid));
        for (const doc of docsToAdd) {
          if (!existingUids.has(doc.uid)) {
            type.files.push(doc);
          }
        }

        // Convenience field for frontend
        if (type.files.length > 0) {
          (type as any).fileUrl = type.files[0]?.fileUrl;
        }
      }
    }

    return {
      data,
      meta: {
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit),
      },
    };
  }

  async update(
    uid: string,
    data: IUpdateMasterDocumentType,
    updatedBy: string,
    tenantUid?: string | null,
  ): Promise<IMasterDocumentTypeSafe> {
    const existing = await this.repository.getByUid(uid, tenantUid);
    if (!existing) {
      throw new CustomError(MASTER_DOCUMENT_TYPE_MESSAGES.NOT_FOUND, 404);
    }

    if (data.name && data.name !== existing.name) {
      const nameExists = await this.repository.getByName(data.name, tenantUid);
      if (nameExists) {
        throw new CustomError(MASTER_DOCUMENT_TYPE_MESSAGES.NAME_EXISTS, 400);
      }
    }

    const updated = await this.repository.update(
      uid,
      data,
      updatedBy,
      tenantUid,
    );
    if (!updated) {
      throw new CustomError(MASTER_DOCUMENT_TYPE_MESSAGES.NOT_FOUND, 404);
    }
    return toMasterDocumentTypeSafe(updated);
  }

  async delete(
    uid: string,
    deletedBy: string,
    tenantUid?: string | null,
  ): Promise<void> {
    const existing = await this.repository.getByUid(uid, tenantUid);
    if (!existing) {
      throw new CustomError(MASTER_DOCUMENT_TYPE_MESSAGES.NOT_FOUND, 404);
    }
    if (existing.isSystem === 1) {
      throw new CustomError(MASTER_DOCUMENT_TYPE_MESSAGES.SYSTEM_DELETE, 400);
    }

    const success = await this.repository.softDelete(uid, deletedBy);
    if (!success) {
      throw new CustomError(MASTER_DOCUMENT_TYPE_MESSAGES.NOT_FOUND, 404);
    }
  }
}

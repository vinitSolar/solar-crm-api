import type { Pool, PoolClient } from "pg";
import type {
  IDocumentAssociation,
  ModuleType,
  IContextDocument,
} from "../interfaces/master-documents.interface.js";
import { v4 as uuidv4 } from "uuid";

const ASSOC_COLUMNS = `
    da.id, da.uid, da.tenant_uid AS "tenantUid",
    da.master_document_uid AS "masterDocumentUid",
    da.module, da.context_uid AS "contextUid",
    da.remarks,
    da.is_active AS "isActive", da.is_deleted AS "isDeleted",
    da.deleted_at AS "deletedAt",
    da.created_at AS "createdAt", da.updated_at AS "updatedAt",
    da.created_by AS "createdBy", da.updated_by AS "updatedBy", da.deleted_by AS "deletedBy"
`;

export class DocumentAssociationRepository {
  private readonly pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async create(
    tenantUid: string,
    masterDocumentUid: string,
    module: ModuleType,
    contextUid: string,
    remarks: string | undefined,
    createdBy: string,
    client?: PoolClient,
  ): Promise<IDocumentAssociation> {
    const executor = client || this.pool;
    const uid = uuidv4();

    const query = `
            INSERT INTO document_associations (
                uid, tenant_uid, master_document_uid, module, context_uid, remarks, created_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING ${ASSOC_COLUMNS.replace(/da\./g, "")}
        `;
    const values = [
      uid,
      tenantUid,
      masterDocumentUid,
      module,
      contextUid,
      remarks ?? null,
      createdBy,
    ];

    const result = await executor.query(query, values);
    return result.rows[0] as IDocumentAssociation;
  }

  async getByContext(
    tenantUid: string,
    module: ModuleType,
    contextUid: string,
    client?: PoolClient,
  ): Promise<IContextDocument[]> {
    const executor = client || this.pool;

    // This query joins the association to the master document and the document type,
    // returning the master document details along with the association uid and remarks.
    const query = `
            SELECT 
                md.uid, md.document_type_uid AS "documentTypeUid",
                mdt.name AS "documentTypeName", mdt.category AS "documentTypeCategory",
                md.entity_type AS "entityType", md.entity_uid AS "entityUid",
                md.original_name AS "originalName", md.file_url AS "fileUrl",
                md.mime_type AS "mimeType", md.file_size AS "fileSize",
                md.document_number AS "documentNumber", md.remarks,
                md.version, md.is_latest AS "isLatest",
                md.created_at AS "createdAt", md.created_by AS "createdBy",
                da.uid AS "associationUid", da.remarks AS "associationRemarks"
            FROM document_associations da
            JOIN master_documents md ON md.uid = da.master_document_uid
            LEFT JOIN master_document_types mdt ON mdt.uid = md.document_type_uid
            WHERE da.tenant_uid = $1 AND da.module = $2 AND da.context_uid = $3
              AND da.is_deleted = 0 AND md.is_deleted = 0
            ORDER BY mdt.sort_order ASC, md.created_at DESC
        `;
    const result = await executor.query(query, [tenantUid, module, contextUid]);
    return result.rows as IContextDocument[];
  }

  async getByMasterDocument(
    tenantUid: string,
    masterDocumentUid: string,
    client?: PoolClient,
  ): Promise<IDocumentAssociation[]> {
    const executor = client || this.pool;
    const query = `
            SELECT ${ASSOC_COLUMNS}
            FROM document_associations da
            WHERE da.master_document_uid = $1 AND da.tenant_uid = $2 AND da.is_deleted = 0
        `;
    const result = await executor.query(query, [masterDocumentUid, tenantUid]);
    return result.rows as IDocumentAssociation[];
  }

  async getByMasterDocumentAndContext(
    tenantUid: string,
    masterDocumentUid: string,
    module: ModuleType,
    contextUid: string,
    client?: PoolClient,
  ): Promise<IDocumentAssociation | null> {
    const executor = client || this.pool;
    const query = `
            SELECT ${ASSOC_COLUMNS}
            FROM document_associations da
            WHERE da.master_document_uid = $1 AND da.tenant_uid = $2 
              AND da.module = $3 AND da.context_uid = $4
              AND da.is_deleted = 0
        `;
    const result = await executor.query(query, [
      masterDocumentUid,
      tenantUid,
      module,
      contextUid,
    ]);
    return result.rows.length > 0
      ? (result.rows[0] as IDocumentAssociation)
      : null;
  }

  async softDelete(
    tenantUid: string,
    uid: string,
    deletedBy: string,
    client?: PoolClient,
  ): Promise<boolean> {
    const executor = client || this.pool;
    const query = `
            UPDATE document_associations
            SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP, deleted_by = $3, updated_at = CURRENT_TIMESTAMP
            WHERE uid = $1 AND tenant_uid = $2 AND is_deleted = 0
        `;
    const result = await executor.query(query, [uid, tenantUid, deletedBy]);
    return (result.rowCount ?? 0) > 0;
  }

  async softDeleteByMasterDocument(
    tenantUid: string,
    masterDocumentUid: string,
    deletedBy: string,
    client?: PoolClient,
  ): Promise<void> {
    const executor = client || this.pool;
    const query = `
            UPDATE document_associations
            SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP, deleted_by = $3, updated_at = CURRENT_TIMESTAMP
            WHERE master_document_uid = $1 AND tenant_uid = $2 AND is_deleted = 0
        `;
    await executor.query(query, [masterDocumentUid, tenantUid, deletedBy]);
  }
}

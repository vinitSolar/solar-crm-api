import type { Pool, PoolClient } from "pg";
import type {
  IMasterDocument,
  EntityType,
} from "../interfaces/master-documents.interface.js";
import { v4 as uuidv4 } from "uuid";

const DOC_COLUMNS = `
    md.id, md.uid, md.tenant_uid AS "tenantUid",
    md.document_type_uid AS "documentTypeUid",
    md.entity_type AS "entityType", md.entity_uid AS "entityUid",
    md.original_name AS "originalName", md.file_name AS "fileName",
    md.file_url AS "fileUrl", md.mime_type AS "mimeType",
    md.file_size AS "fileSize", md.document_number AS "documentNumber",
    md.remarks, md.version, md.is_latest AS "isLatest",
    md.parent_document_uid AS "parentDocumentUid",
    md.is_active AS "isActive", md.is_deleted AS "isDeleted",
    md.deleted_at AS "deletedAt",
    md.created_at AS "createdAt", md.updated_at AS "updatedAt",
    md.created_by AS "createdBy", md.updated_by AS "updatedBy", md.deleted_by AS "deletedBy"
`;

const DOC_COLUMNS_WITH_TYPE = `
    ${DOC_COLUMNS},
    mdt.name AS "documentTypeName",
    mdt.category AS "documentTypeCategory"
`;

export class MasterDocumentRepository {
  private readonly pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async create(
    tenantUid: string,
    documentTypeUid: string,
    entityType: EntityType,
    entityUid: string,
    originalName: string,
    fileName: string,
    fileUrl: string,
    mimeType: string,
    fileSize: number,
    documentNumber: string | undefined,
    remarks: string | undefined,
    createdBy: string,
    client?: PoolClient,
  ): Promise<IMasterDocument> {
    const executor = client || this.pool;
    const uid = uuidv4();

    const query = `
            INSERT INTO master_documents (
                uid, tenant_uid, document_type_uid, entity_type, entity_uid,
                original_name, file_name, file_url, mime_type, file_size,
                document_number, remarks, created_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING ${DOC_COLUMNS.replace(/md\./g, "")}
        `;
    const values = [
      uid,
      tenantUid,
      documentTypeUid,
      entityType,
      entityUid,
      originalName,
      fileName,
      fileUrl,
      mimeType,
      fileSize,
      documentNumber ?? null,
      remarks ?? null,
      createdBy,
    ];

    const result = await executor.query(query, values);
    return result.rows[0] as IMasterDocument;
  }

  async getByUid(
    tenantUid: string,
    uid: string,
    client?: PoolClient,
  ): Promise<IMasterDocument | null> {
    const executor = client || this.pool;
    const query = `
            SELECT ${DOC_COLUMNS_WITH_TYPE}
            FROM master_documents md
            LEFT JOIN master_document_types mdt ON mdt.uid = md.document_type_uid
            WHERE md.uid = $1 AND md.tenant_uid = $2 AND md.is_deleted = 0
        `;
    const result = await executor.query(query, [uid, tenantUid]);
    return result.rows.length > 0 ? (result.rows[0] as IMasterDocument) : null;
  }

  async getByEntity(
    tenantUid: string,
    entityType: EntityType,
    entityUid: string,
    client?: PoolClient,
  ): Promise<IMasterDocument[]> {
    const executor = client || this.pool;
    const query = `
            SELECT ${DOC_COLUMNS_WITH_TYPE}
            FROM master_documents md
            LEFT JOIN master_document_types mdt ON mdt.uid = md.document_type_uid
            WHERE md.tenant_uid = $1 AND md.entity_type = $2 AND md.entity_uid = $3
              AND md.is_deleted = 0 AND md.is_latest = 1
            ORDER BY md.created_at DESC
        `;
    const result = await executor.query(query, [
      tenantUid,
      entityType,
      entityUid,
    ]);
    return result.rows as IMasterDocument[];
  }

  async getByEntityAndType(
    tenantUid: string,
    entityType: EntityType,
    entityUid: string,
    documentTypeUid: string,
    client?: PoolClient,
  ): Promise<IMasterDocument[]> {
    const executor = client || this.pool;
    const query = `
            SELECT ${DOC_COLUMNS_WITH_TYPE}
            FROM master_documents md
            LEFT JOIN master_document_types mdt ON mdt.uid = md.document_type_uid
            WHERE md.tenant_uid = $1 AND md.entity_type = $2 AND md.entity_uid = $3
              AND md.document_type_uid = $4
              AND md.is_deleted = 0 AND md.is_latest = 1
        `;
    const result = await executor.query(query, [
      tenantUid,
      entityType,
      entityUid,
      documentTypeUid,
    ]);
    return result.rows as IMasterDocument[];
  }

  async softDelete(
    tenantUid: string,
    uid: string,
    deletedBy: string,
    client?: PoolClient,
  ): Promise<boolean> {
    const executor = client || this.pool;
    const query = `
            UPDATE master_documents
            SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP, deleted_by = $3, updated_at = CURRENT_TIMESTAMP
            WHERE uid = $1 AND tenant_uid = $2 AND is_deleted = 0
        `;
    const result = await executor.query(query, [uid, tenantUid, deletedBy]);
    return (result.rowCount ?? 0) > 0;
  }

  async markNotLatest(
    tenantUid: string,
    uid: string,
    client?: PoolClient,
  ): Promise<void> {
    const executor = client || this.pool;
    await executor.query(
      `UPDATE master_documents SET is_latest = 0, updated_at = CURRENT_TIMESTAMP WHERE uid = $1 AND tenant_uid = $2`,
      [uid, tenantUid],
    );
  }
}

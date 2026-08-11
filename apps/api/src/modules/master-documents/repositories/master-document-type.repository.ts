import type { Pool, PoolClient } from "pg";
import type {
  IMasterDocumentType,
  ICreateMasterDocumentType,
  IUpdateMasterDocumentType,
} from "../interfaces/master-documents.interface.js";
import { v4 as uuidv4 } from "uuid";

const DOC_TYPE_COLUMNS = `
    mdt.id, mdt.uid, mdt.tenant_uid AS "tenantUid", mdt.name, mdt.category,
    mdt.description, mdt.allowed_extensions AS "allowedExtensions",
    mdt.allow_multiple AS "allowMultiple", mdt.is_required AS "isRequired",
    mdt.applicable_modules AS "applicableModules", mdt.sort_order AS "sortOrder",
    mdt.is_system AS "isSystem", mdt.is_common_for_all_modules AS "isCommonForAllModules", 
    mdt.is_active AS "isActive", mdt.is_deleted AS "isDeleted",
    mdt.deleted_at AS "deletedAt",
    mdt.created_at AS "createdAt", mdt.updated_at AS "updatedAt",
    mdt.created_by AS "createdBy", mdt.updated_by AS "updatedBy", mdt.deleted_by AS "deletedBy"
`;

export class MasterDocumentTypeRepository {
  private readonly pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async create(
    tenantUid: string | null,
    data: ICreateMasterDocumentType,
    isSystem: number,
    createdBy: string,
    client?: PoolClient,
  ): Promise<IMasterDocumentType> {
    const executor = client || this.pool;
    const uid = uuidv4();

    let sortOrder = data.sortOrder;
    if (sortOrder === undefined || sortOrder === null) {
      const maxRes = await executor.query(
        `SELECT COALESCE(MAX(sort_order), 0) AS max_sort FROM master_document_types WHERE is_deleted = 0`,
        [],
      );
      sortOrder = Number(maxRes.rows[0]?.max_sort || 0) + 1;
    }

    const query = `
            INSERT INTO master_document_types (
                uid, tenant_uid, name, category, description, allowed_extensions,
                allow_multiple, is_required, applicable_modules, sort_order, is_system, is_common_for_all_modules, created_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING ${DOC_TYPE_COLUMNS.replace(/mdt\./g, "")}
        `;
    const values = [
      uid,
      tenantUid,
      data.name,
      data.category ?? "general",
      data.description ?? null,
      data.allowedExtensions ?? "pdf,jpg,jpeg,png",
      data.allowMultiple ?? 0,
      data.isRequired ?? 0,
      data.applicableModules ?? [],
      sortOrder,
      isSystem,
      data.isCommonForAllModules ?? 0,
      createdBy,
    ];

    const result = await executor.query(query, values);
    return result.rows[0] as IMasterDocumentType;
  }

  async getByUid(
    uid: string,
    tenantUid?: string | null,
    client?: PoolClient,
  ): Promise<IMasterDocumentType | null> {
    const executor = client || this.pool;
    const query = `
            SELECT ${DOC_TYPE_COLUMNS}
            FROM master_document_types mdt
            WHERE mdt.uid = $1 AND mdt.is_deleted = 0
              AND (mdt.tenant_uid IS NULL OR mdt.tenant_uid = $2)
        `;
    const result = await executor.query(query, [uid, tenantUid ?? null]);
    return result.rows.length > 0
      ? (result.rows[0] as IMasterDocumentType)
      : null;
  }

  async getByName(
    name: string,
    tenantUid?: string | null,
    client?: PoolClient,
  ): Promise<IMasterDocumentType | null> {
    const executor = client || this.pool;
    const query = `
            SELECT ${DOC_TYPE_COLUMNS}
            FROM master_document_types mdt
            WHERE mdt.name = $1 AND mdt.is_deleted = 0
              AND (mdt.tenant_uid IS NULL OR mdt.tenant_uid = $2)
        `;
    const result = await executor.query(query, [name, tenantUid ?? null]);
    return result.rows.length > 0
      ? (result.rows[0] as IMasterDocumentType)
      : null;
  }

  async findByUids(
    uids: string[],
    tenantUid?: string | null,
    client?: PoolClient,
  ): Promise<IMasterDocumentType[]> {
    if (!uids.length) return [];
    const executor = client || this.pool;
    const query = `
            SELECT ${DOC_TYPE_COLUMNS}
            FROM master_document_types mdt
            WHERE mdt.uid = ANY($1) AND mdt.is_deleted = 0
              AND (mdt.tenant_uid IS NULL OR mdt.tenant_uid = $2)
        `;
    const result = await executor.query(query, [uids, tenantUid ?? null]);
    return result.rows as IMasterDocumentType[];
  }

  async getByModule(
    module: string,
    tenantUid?: string | null,
    client?: PoolClient,
  ): Promise<IMasterDocumentType[]> {
    const executor = client || this.pool;
    const query = `
            SELECT ${DOC_TYPE_COLUMNS}
            FROM master_document_types mdt
            WHERE $1 = ANY(mdt.applicable_modules)
              AND mdt.is_deleted = 0
              AND mdt.is_active = 1
              AND (mdt.tenant_uid IS NULL OR mdt.tenant_uid = $2)
            ORDER BY mdt.sort_order ASC, mdt.name ASC
        `;
    const result = await executor.query(query, [module, tenantUid ?? null]);
    return result.rows as IMasterDocumentType[];
  }

  async getAll(
    tenantUid?: string | null,
    status?: string,
  ): Promise<IMasterDocumentType[]> {
    let whereClause = `WHERE (mdt.tenant_uid IS NULL OR mdt.tenant_uid = $1)`;

    if (status === "deleted") {
      whereClause += ` AND mdt.is_deleted = 1`;
    } else if (status === "all") {
      // no filter
    } else {
      whereClause += ` AND mdt.is_deleted = 0`;
    }

    const query = `
            SELECT ${DOC_TYPE_COLUMNS}
            FROM master_document_types mdt
            ${whereClause}
            ORDER BY mdt.sort_order ASC, mdt.name ASC
        `;
    const result = await this.pool.query(query, [tenantUid ?? null]);
    return result.rows as IMasterDocumentType[];
  }

  async getPaginated(
    tenantUid: string | null,
    page: number,
    limit: number,
    search?: string,
    status?: string,
    module?: string,
    category?: number,
  ) {
    const offset = (page - 1) * limit;
    let whereClause = `WHERE (mdt.tenant_uid IS NULL OR mdt.tenant_uid = $1)`;
    const values: any[] = [tenantUid ?? null];
    let paramIndex = 2;

    if (status === "deleted") {
      whereClause += ` AND mdt.is_deleted = 1`;
    } else if (status === "all") {
      // no filter
    } else {
      whereClause += ` AND mdt.is_deleted = 0`;
    }

    if (search) {
      whereClause += ` AND mdt.name ILIKE $${paramIndex++}`;
      values.push(`%${search}%`);
    }

    if (module) {
      whereClause += ` AND $${paramIndex++} = ANY(mdt.applicable_modules)`;
      values.push(module);
    }

    if (category) {
      whereClause += ` AND mdt.category = $${paramIndex++}`;
      values.push(category);
    }

    const countQuery = `SELECT COUNT(*) FROM master_document_types mdt ${whereClause}`;
    const countValues = [...values];
    const countResult = await this.pool.query(countQuery, countValues);
    const total = parseInt(countResult.rows[0].count, 10);

    values.push(limit, offset);
    const dataQuery = `
            SELECT ${DOC_TYPE_COLUMNS}
            FROM master_document_types mdt
            ${whereClause}
            ORDER BY mdt.sort_order ASC, mdt.created_at DESC
            LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `;
    const dataResult = await this.pool.query(dataQuery, values);

    return {
      total,
      rows: dataResult.rows as IMasterDocumentType[],
    };
  }

  async update(
    uid: string,
    data: IUpdateMasterDocumentType,
    updatedBy: string,
    tenantUid?: string | null,
    client?: PoolClient,
  ): Promise<IMasterDocumentType | null> {
    const executor = client || this.pool;
    const setFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      setFields.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.category !== undefined) {
      setFields.push(`category = $${paramIndex++}`);
      values.push(data.category);
    }
    if (data.description !== undefined) {
      setFields.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.allowedExtensions !== undefined) {
      setFields.push(`allowed_extensions = $${paramIndex++}`);
      values.push(data.allowedExtensions);
    }
    if (data.allowMultiple !== undefined) {
      setFields.push(`allow_multiple = $${paramIndex++}`);
      values.push(data.allowMultiple);
    }
    if (data.isRequired !== undefined) {
      setFields.push(`is_required = $${paramIndex++}`);
      values.push(data.isRequired);
    }
    if (data.applicableModules !== undefined) {
      setFields.push(`applicable_modules = $${paramIndex++}`);
      values.push(data.applicableModules);
    }
    if (data.sortOrder !== undefined) {
      setFields.push(`sort_order = $${paramIndex++}`);
      values.push(data.sortOrder);
    }
    if (data.isCommonForAllModules !== undefined) {
      setFields.push(`is_common_for_all_modules = $${paramIndex++}`);
      values.push(data.isCommonForAllModules);
    }
    if (data.isActive !== undefined) {
      setFields.push(`is_active = $${paramIndex++}`);
      values.push(data.isActive);
    }

    if (setFields.length === 0) return null;

    setFields.push(`updated_at = CURRENT_TIMESTAMP`);
    setFields.push(`updated_by = $${paramIndex++}`);
    values.push(updatedBy);

    values.push(uid);

    const query = `
            UPDATE master_document_types
            SET ${setFields.join(", ")}
            WHERE uid = $${paramIndex} AND is_deleted = 0
            RETURNING ${DOC_TYPE_COLUMNS.replace(/mdt\./g, "")}
        `;

    const result = await executor.query(query, values);
    return result.rows.length > 0
      ? (result.rows[0] as IMasterDocumentType)
      : null;
  }

  async softDelete(
    uid: string,
    deletedBy: string,
    client?: PoolClient,
  ): Promise<boolean> {
    const executor = client || this.pool;
    const query = `
            UPDATE master_document_types
            SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP, deleted_by = $2, updated_at = CURRENT_TIMESTAMP
            WHERE uid = $1 AND is_system = 0 AND is_deleted = 0
        `;
    const result = await executor.query(query, [uid, deletedBy]);
    return (result.rowCount ?? 0) > 0;
  }

  async restore(
    uid: string,
    updatedBy: string,
    client?: PoolClient,
  ): Promise<boolean> {
    const executor = client || this.pool;
    const query = `
            UPDATE master_document_types
            SET is_deleted = 0, deleted_at = NULL, deleted_by = NULL, updated_by = $2, updated_at = CURRENT_TIMESTAMP
            WHERE uid = $1 AND is_deleted = 1
        `;
    const result = await executor.query(query, [uid, updatedBy]);
    return (result.rowCount ?? 0) > 0;
  }
}

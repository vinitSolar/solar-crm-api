import type { Pool, PoolClient } from "pg";
import type { ISurveyDocumentType, ICreateSurveyDocumentType, IUpdateSurveyDocumentType } from "../interfaces/survey-documents.interface.js";
import { v4 as uuidv4 } from "uuid";

const SURVEY_DOCUMENT_TYPE_COLUMNS = `
    sdt.id, sdt.uid, sdt.tenant_uid AS "tenantUid", sdt.name, sdt.description,
    sdt.is_required AS "isRequired", sdt.allow_multiple AS "allowMultiple", sdt.sort_order AS "sortOrder",
    sdt.is_system AS "isSystem", sdt.is_active AS "isActive", sdt.is_deleted AS "isDeleted",
    sdt.created_at AS "createdAt", sdt.updated_at AS "updatedAt",
    sdt.created_by AS "createdBy", sdt.updated_by AS "updatedBy", sdt.deleted_by AS "deletedBy"
`;

export class SurveyDocumentTypeRepository {
    private readonly pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    async create(tenantUid: string, data: ICreateSurveyDocumentType, isSystem: number, createdBy: string, client?: PoolClient): Promise<ISurveyDocumentType> {
        const uid = uuidv4();
        const query = `
            INSERT INTO survey_document_types (
                uid, tenant_uid, name, description, is_required, allow_multiple, sort_order, is_system, created_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING ${SURVEY_DOCUMENT_TYPE_COLUMNS.replace(/sdt\./g, '')}
        `;
        const values = [
            uid,
            tenantUid,
            data.name,
            data.description ?? null,
            data.isRequired ?? 0,
            data.allowMultiple ?? 0,
            data.sortOrder ?? 0,
            isSystem,
            createdBy
        ];

        const result = client 
            ? await client.query(query, values)
            : await this.pool.query(query, values);
            
        return result.rows[0] as ISurveyDocumentType;
    }

    async getByUid(tenantUid: string, uid: string): Promise<ISurveyDocumentType | null> {
        const query = `
            SELECT ${SURVEY_DOCUMENT_TYPE_COLUMNS}
            FROM survey_document_types sdt
            WHERE sdt.uid = $1 AND sdt.tenant_uid = $2 AND sdt.is_deleted = 0
        `;
        const result = await this.pool.query(query, [uid, tenantUid]);
        return result.rows.length > 0 ? (result.rows[0] as ISurveyDocumentType) : null;
    }

    async getPaginated(tenantUid: string, page: number, limit: number, search?: string, status?: string) {
        const offset = (page - 1) * limit;
        let whereClause = `WHERE sdt.tenant_uid = $1`;
        const values: any[] = [tenantUid];
        let paramIndex = 2;

        if (status === "deleted") {
            whereClause += ` AND sdt.is_deleted = 1`;
        } else if (status === "all") {
            // no filter on deleted
        } else {
            whereClause += ` AND sdt.is_deleted = 0`;
        }

        if (search) {
            whereClause += ` AND sdt.name ILIKE $${paramIndex++}`;
            values.push(`%${search}%`);
        }

        const countQuery = `SELECT COUNT(*) FROM survey_document_types sdt ${whereClause}`;
        const dataQuery = `
            SELECT ${SURVEY_DOCUMENT_TYPE_COLUMNS}
            FROM survey_document_types sdt
            ${whereClause}
            ORDER BY sdt.sort_order ASC, sdt.created_at DESC
            LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `;

        const countResult = await this.pool.query(countQuery, values.slice(0, paramIndex - 3));
        const total = parseInt(countResult.rows[0].count, 10);

        values.push(limit, offset);
        const dataResult = await this.pool.query(dataQuery, values);

        return {
            total,
            rows: dataResult.rows as ISurveyDocumentType[],
        };
    }

    async getAll(tenantUid: string, status?: string): Promise<ISurveyDocumentType[]> {
        let whereClause = `WHERE sdt.tenant_uid = $1`;
        
        if (status === "deleted") {
            whereClause += ` AND sdt.is_deleted = 1`;
        } else if (status === "all") {
            // no filter
        } else {
            whereClause += ` AND sdt.is_deleted = 0`; // active by default
        }

        const query = `
            SELECT ${SURVEY_DOCUMENT_TYPE_COLUMNS}
            FROM survey_document_types sdt
            ${whereClause}
            ORDER BY sdt.sort_order ASC, sdt.created_at DESC
        `;
        
        const result = await this.pool.query(query, [tenantUid]);
        return result.rows as ISurveyDocumentType[];
    }

    async update(tenantUid: string, uid: string, data: IUpdateSurveyDocumentType, updatedBy: string, client?: PoolClient): Promise<ISurveyDocumentType> {
        const setFields: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (data.name !== undefined) {
            setFields.push(`name = $${paramIndex++}`);
            values.push(data.name);
        }
        if (data.description !== undefined) {
            setFields.push(`description = $${paramIndex++}`);
            values.push(data.description);
        }
        if (data.isRequired !== undefined) {
            setFields.push(`is_required = $${paramIndex++}`);
            values.push(data.isRequired);
        }
        if (data.allowMultiple !== undefined) {
            setFields.push(`allow_multiple = $${paramIndex++}`);
            values.push(data.allowMultiple);
        }
        if (data.sortOrder !== undefined) {
            setFields.push(`sort_order = $${paramIndex++}`);
            values.push(data.sortOrder);
        }

        setFields.push(`updated_at = CURRENT_TIMESTAMP`);
        setFields.push(`updated_by = $${paramIndex++}`);
        values.push(updatedBy);

        values.push(uid, tenantUid);

        const query = `
            UPDATE survey_document_types sdt
            SET ${setFields.join(", ")}
            WHERE sdt.uid = $${paramIndex - 2} AND sdt.tenant_uid = $${paramIndex - 1} AND sdt.is_deleted = 0
            RETURNING ${SURVEY_DOCUMENT_TYPE_COLUMNS.replace(/sdt\./g, '')}
        `;

        const result = client 
            ? await client.query(query, values)
            : await this.pool.query(query, values);
            
        return result.rows[0] as ISurveyDocumentType;
    }

    async softDelete(tenantUid: string, uid: string, deletedBy: string, client?: PoolClient): Promise<boolean> {
        const query = `
            UPDATE survey_document_types
            SET is_deleted = 1, deleted_by = $3, updated_at = CURRENT_TIMESTAMP
            WHERE uid = $1 AND tenant_uid = $2 AND is_system = 0 AND is_deleted = 0
        `;
        const result = client
            ? await client.query(query, [uid, tenantUid, deletedBy])
            : await this.pool.query(query, [uid, tenantUid, deletedBy]);
            
        return (result.rowCount ?? 0) > 0;
    }

    async restore(tenantUid: string, uid: string, updatedBy: string, client?: PoolClient): Promise<boolean> {
        const query = `
            UPDATE survey_document_types
            SET is_deleted = 0, deleted_by = NULL, updated_by = $3, updated_at = CURRENT_TIMESTAMP
            WHERE uid = $1 AND tenant_uid = $2 AND is_deleted = 1
        `;
        const result = client
            ? await client.query(query, [uid, tenantUid, updatedBy])
            : await this.pool.query(query, [uid, tenantUid, updatedBy]);
            
        return (result.rowCount ?? 0) > 0;
    }
}

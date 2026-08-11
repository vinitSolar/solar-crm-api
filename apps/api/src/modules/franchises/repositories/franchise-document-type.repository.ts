import pool from "@packages/connection.js";
import { v4 as uuidv4 } from "uuid";
import type { IFranchiseDocumentType } from "../interfaces/franchise.interface.js";

const TYPE_COLUMNS = `
    id,
    uid,
    tenant_uid AS "tenantUid",
    name,
    description,
    allow_multiple AS "allowMultiple",
    is_required AS "isRequired",
    sort_order AS "sortOrder",
    is_active AS "isActive",
    is_deleted AS "isDeleted",
    created_at AS "createdAt",
    updated_at AS "updatedAt",
    created_by AS "createdBy",
    updated_by AS "updatedBy",
    deleted_by AS "deletedBy"
`;

export class FranchiseDocumentTypeRepository {
    /**
     * Creates a new franchise document type.
     */
    async create(
        tenantUid: string,
        data: { name: string; description?: string; allowMultiple?: number; isRequired?: number; sortOrder?: number },
        createdBy: string
    ): Promise<IFranchiseDocumentType> {
        const uid = uuidv4();
        const query = `
            INSERT INTO franchise_document_types (
                uid, tenant_uid, name, description, allow_multiple, is_required, sort_order, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING ${TYPE_COLUMNS}
        `;
        const values = [
            uid,
            tenantUid,
            data.name,
            data.description ?? null,
            data.allowMultiple ?? 0,
            data.isRequired ?? 0,
            data.sortOrder ?? 0,
            createdBy,
        ];
        console.log("EXECUTING QUERY:", query);
        console.log("WITH VALUES:", values);
        const result = await pool.query(query, values);
        return result.rows[0] as IFranchiseDocumentType;
    }

    /**
     * Retrieves all active document types for a tenant.
     */
    async getActiveTypesByTenant(tenantUid: string): Promise<IFranchiseDocumentType[]> {
        const query = `
            SELECT ${TYPE_COLUMNS} 
            FROM franchise_document_types 
            WHERE tenant_uid = $1 AND is_deleted = 0 AND is_active = 1
            ORDER BY sort_order ASC, name ASC
        `;
        const result = await pool.query(query, [tenantUid]);
        return result.rows as IFranchiseDocumentType[];
    }

    /**
     * Gets a specific document type by UID.
     */
    async getByUid(uid: string): Promise<IFranchiseDocumentType | null> {
        const query = `
            SELECT ${TYPE_COLUMNS} 
            FROM franchise_document_types 
            WHERE uid = $1 AND is_deleted = 0
        `;
        const result = await pool.query(query, [uid]);
        return (result.rows[0] as IFranchiseDocumentType) || null;
    }

    /**
     * Checks if a document type name exists for a tenant.
     */
    async checkNameExists(tenantUid: string, name: string): Promise<boolean> {
        const query = `
            SELECT 1 FROM franchise_document_types 
            WHERE tenant_uid = $1 AND name = $2 AND is_deleted = 0
            LIMIT 1
        `;
        const result = await pool.query(query, [tenantUid, name]);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Upserts a document type for a tenant based on name.
     */
    async upsert(
        tenantUid: string,
        data: { name: string; description?: string; allowMultiple?: number; isRequired?: number; sortOrder?: number },
        createdBy: string
    ): Promise<IFranchiseDocumentType> {
        const query = `
            INSERT INTO franchise_document_types (
                uid, tenant_uid, name, description, allow_multiple, is_required, sort_order, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (tenant_uid, name) WHERE is_deleted = 0
            DO UPDATE SET 
                description = EXCLUDED.description,
                allow_multiple = EXCLUDED.allow_multiple,
                is_required = EXCLUDED.is_required,
                sort_order = EXCLUDED.sort_order,
                updated_at = CURRENT_TIMESTAMP,
                updated_by = $8
            RETURNING ${TYPE_COLUMNS}
        `;
        const values = [
            uuidv4(),
            tenantUid,
            data.name,
            data.description ?? null,
            data.allowMultiple ?? 0,
            data.isRequired ?? 0,
            data.sortOrder ?? 0,
            createdBy,
        ];
        const result = await pool.query(query, values);
        return result.rows[0] as IFranchiseDocumentType;
    }

    /**
     * Gets all document types for a tenant, optionally filtered by status.
     */
    async getAll(tenantUid: string, status?: string): Promise<IFranchiseDocumentType[]> {
        let query = `
            SELECT ${TYPE_COLUMNS} 
            FROM franchise_document_types 
            WHERE tenant_uid = $1
        `;
        const params: any[] = [tenantUid];

        if (status === "active") {
            query += ` AND is_active = 1 AND is_deleted = 0`;
        } else if (status === "deleted") {
            query += ` AND is_deleted = 1`;
        } else {
            query += ` AND is_deleted = 0`;
        }

        query += ` ORDER BY sort_order ASC, name ASC`;

        const result = await pool.query(query, params);
        return result.rows as IFranchiseDocumentType[];
    }

    /**
     * Gets paginated document types for a tenant.
     */
    async getPaginated(
        tenantUid: string,
        page: number,
        limit: number,
        search?: string,
        status?: string
    ): Promise<{ rows: IFranchiseDocumentType[]; total: number }> {
        const offset = (page - 1) * limit;
        const params: any[] = [tenantUid];
        let whereClause = `WHERE tenant_uid = $1`;

        if (status === "active") {
            whereClause += ` AND is_active = 1 AND is_deleted = 0`;
        } else if (status === "deleted") {
            whereClause += ` AND is_deleted = 1`;
        } else if (status === "all") {
            // no filter on deleted
        } else {
            whereClause += ` AND is_deleted = 0`;
        }

        if (search) {
            params.push(`%${search}%`);
            whereClause += ` AND name ILIKE $${params.length}`;
        }

        const countQuery = `SELECT COUNT(*) FROM franchise_document_types ${whereClause}`;
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count, 10);

        params.push(limit, offset);
        const dataQuery = `
            SELECT ${TYPE_COLUMNS} 
            FROM franchise_document_types 
            ${whereClause}
            ORDER BY sort_order ASC, created_at DESC
            LIMIT $${params.length - 1} OFFSET $${params.length}
        `;
        const result = await pool.query(dataQuery, params);

        return { rows: result.rows as IFranchiseDocumentType[], total };
    }

    /**
     * Updates an existing franchise document type.
     */
    async update(
        uid: string,
        tenantUid: string,
        data: { name?: string; description?: string; allowMultiple?: number; isRequired?: number; sortOrder?: number; isActive?: number },
        updatedBy: string
    ): Promise<IFranchiseDocumentType | null> {
        const fields: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (data.name !== undefined) {
            fields.push(`name = $${paramIndex++}`);
            values.push(data.name);
        }
        if (data.description !== undefined) {
            fields.push(`description = $${paramIndex++}`);
            values.push(data.description);
        }
        if (data.allowMultiple !== undefined) {
            fields.push(`allow_multiple = $${paramIndex++}`);
            values.push(data.allowMultiple);
        }
        if (data.isRequired !== undefined) {
            fields.push(`is_required = $${paramIndex++}`);
            values.push(data.isRequired);
        }
        if (data.sortOrder !== undefined) {
            fields.push(`sort_order = $${paramIndex++}`);
            values.push(data.sortOrder);
        }
        if (data.isActive !== undefined) {
            fields.push(`is_active = $${paramIndex++}`);
            values.push(data.isActive);
        }

        if (fields.length === 0) return null;

        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        fields.push(`updated_by = $${paramIndex++}`);
        values.push(updatedBy);

        const uidParamIndex = paramIndex++;
        const tenantUidParamIndex = paramIndex++;
        
        values.push(uid, tenantUid);

        const query = `
            UPDATE franchise_document_types
            SET ${fields.join(", ")}
            WHERE uid = $${uidParamIndex} AND tenant_uid = $${tenantUidParamIndex} AND is_deleted = 0
            RETURNING ${TYPE_COLUMNS}
        `;

        const result = await pool.query(query, values);
        return (result.rows[0] as IFranchiseDocumentType) || null;
    }

    /**
     * Soft deletes a franchise document type.
     */
    async softDelete(uid: string, tenantUid: string, deletedBy: string): Promise<boolean> {
        const query = `
            UPDATE franchise_document_types
            SET is_deleted = 1, is_active = 0, deleted_by = $1, updated_at = CURRENT_TIMESTAMP
            WHERE uid = $2 AND tenant_uid = $3 AND is_deleted = 0
        `;
        const result = await pool.query(query, [deletedBy, uid, tenantUid]);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Restores a soft-deleted franchise document type.
     */
    async restore(uid: string, tenantUid: string, updatedBy: string): Promise<boolean> {
        const query = `
            UPDATE franchise_document_types
            SET is_deleted = 0, is_active = 1, updated_by = $1, deleted_by = NULL, updated_at = CURRENT_TIMESTAMP
            WHERE uid = $2 AND tenant_uid = $3 AND is_deleted = 1
        `;
        const result = await pool.query(query, [updatedBy, uid, tenantUid]);
        return (result.rowCount ?? 0) > 0;
    }
}

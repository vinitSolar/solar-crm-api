import type { Pool, PoolClient } from "pg";
import { v4 as uuidv4 } from "uuid";
import type { IProductDocumentType, ICreateProductDocumentType, IUpdateProductDocumentType } from "../interfaces/product-document-type.interface.js";

const PRODUCT_DOCUMENT_TYPE_COLUMNS = `
    pdt.id, pdt.uid, pdt.tenant_uid as "tenantUid", pdt.name, pdt.description, 
    pdt.allowed_extensions as "allowedExtensions", pdt.allow_multiple as "allowMultiple", 
    pdt.is_required as "isRequired", pdt.is_active as "isActive", pdt.is_deleted as "isDeleted", 
    pdt.created_at as "createdAt", pdt.updated_at as "updatedAt", 
    pdt.created_by as "createdBy", pdt.updated_by as "updatedBy", pdt.deleted_by as "deletedBy"
`;

export class ProductDocumentTypeRepository {
    private readonly pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    private mapRowToProductDocumentType(row: any): IProductDocumentType {
        return {
            id: row.id,
            uid: row.uid,
            tenantUid: row.tenantUid || row.tenant_uid,
            name: row.name,
            description: row.description,
            allowedExtensions: row.allowedExtensions || row.allowed_extensions,
            allowMultiple: row.allowMultiple || row.allow_multiple,
            isRequired: row.isRequired || row.is_required,
            isActive: row.isActive || row.is_active,
            isDeleted: row.isDeleted || row.is_deleted,
            createdAt: row.createdAt || row.created_at,
            updatedAt: row.updatedAt || row.updated_at,
            createdBy: row.createdBy || row.created_by,
            updatedBy: row.updatedBy || row.updated_by,
            deletedBy: row.deletedBy || row.deleted_by,
        };
    }

    async create(tenantUid: string, data: ICreateProductDocumentType, createdBy: string, client?: PoolClient): Promise<IProductDocumentType> {
        const uid = uuidv4();
        const query = `
            INSERT INTO product_document_types (
                uid, tenant_uid, name, description, allowed_extensions, allow_multiple, is_required, created_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, uid, tenant_uid, name, description, allowed_extensions, allow_multiple, is_required, is_active, is_deleted, created_at, updated_at, created_by, updated_by, deleted_by
        `;
        const values = [
            uid,
            tenantUid,
            data.name,
            data.description ?? null,
            data.allowedExtensions ?? "pdf,jpg,jpeg,png,docx,xlsx",
            data.allowMultiple ?? 0,
            data.isRequired ?? 0,
            createdBy
        ];

        const result = client 
            ? await client.query(query, values)
            : await this.pool.query(query, values);
            
        return this.mapRowToProductDocumentType(result.rows[0]);
    }

    async getByUid(tenantUid: string, uid: string, client?: PoolClient): Promise<IProductDocumentType | null> {
        const query = `
            SELECT ${PRODUCT_DOCUMENT_TYPE_COLUMNS}
            FROM product_document_types pdt
            WHERE pdt.uid = $1 AND pdt.tenant_uid = $2 AND pdt.is_deleted = 0
        `;
        const result = client
            ? await client.query(query, [uid, tenantUid])
            : await this.pool.query(query, [uid, tenantUid]);
            
        return result.rows.length > 0 ? this.mapRowToProductDocumentType(result.rows[0]) : null;
    }

    async findByTenantAndName(tenantUid: string, name: string, client?: PoolClient): Promise<IProductDocumentType | null> {
        const query = `
            SELECT ${PRODUCT_DOCUMENT_TYPE_COLUMNS}
            FROM product_document_types pdt
            WHERE pdt.tenant_uid = $1 AND pdt.name = $2 AND pdt.is_deleted = 0
        `;
        const result = client
            ? await client.query(query, [tenantUid, name])
            : await this.pool.query(query, [tenantUid, name]);
            
        return result.rows.length > 0 ? this.mapRowToProductDocumentType(result.rows[0]) : null;
    }

    async getPaginated(tenantUid: string, page: number, limit: number, search?: string, status?: string) {
        const offset = (page - 1) * limit;
        let whereClause = `WHERE pdt.tenant_uid = $1`;
        const values: any[] = [tenantUid];
        let paramIndex = 2;

        if (status === "deleted") {
            whereClause += ` AND pdt.is_deleted = 1`;
        } else if (status === "all") {
            // no filter
        } else {
            whereClause += ` AND pdt.is_deleted = 0`;
        }

        if (search) {
            whereClause += ` AND pdt.name ILIKE $${paramIndex++}`;
            values.push(`%${search}%`);
        }

        const countQuery = `SELECT COUNT(*) FROM product_document_types pdt ${whereClause}`;
        const dataQuery = `
            SELECT ${PRODUCT_DOCUMENT_TYPE_COLUMNS}
            FROM product_document_types pdt
            ${whereClause}
            ORDER BY pdt.name ASC, pdt.created_at DESC
            LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `;

        const countResult = await this.pool.query(countQuery, values.slice(0, paramIndex - 3));
        const total = parseInt(countResult.rows[0].count, 10);

        values.push(limit, offset);
        const dataResult = await this.pool.query(dataQuery, values);

        return {
            total,
            rows: dataResult.rows.map(row => this.mapRowToProductDocumentType(row)),
        };
    }

    async getAll(tenantUid: string, status?: string): Promise<IProductDocumentType[]> {
        let whereClause = `WHERE pdt.tenant_uid = $1`;
        
        if (status === "deleted") {
            whereClause += ` AND pdt.is_deleted = 1`;
        } else if (status === "all") {
            // no filter
        } else {
            whereClause += ` AND pdt.is_deleted = 0`;
        }

        const query = `
            SELECT ${PRODUCT_DOCUMENT_TYPE_COLUMNS}
            FROM product_document_types pdt
            ${whereClause}
            ORDER BY pdt.name ASC
        `;
        const result = await this.pool.query(query, [tenantUid]);
        return result.rows.map(row => this.mapRowToProductDocumentType(row));
    }

    async findAllActive(tenantUid: string, client?: PoolClient): Promise<IProductDocumentType[]> {
        const query = `
            SELECT ${PRODUCT_DOCUMENT_TYPE_COLUMNS}
            FROM product_document_types pdt
            WHERE pdt.tenant_uid = $1 AND pdt.is_deleted = 0 AND pdt.is_active = 1
            ORDER BY pdt.name ASC
        `;
        const res = client 
            ? await client.query(query, [tenantUid])
            : await this.pool.query(query, [tenantUid]);
            
        return res.rows.map(row => this.mapRowToProductDocumentType(row));
    }

    async update(tenantUid: string, uid: string, data: IUpdateProductDocumentType, updatedBy: string, client?: PoolClient): Promise<IProductDocumentType> {
        const fields: string[] = ["updated_by = $1", "updated_at = CURRENT_TIMESTAMP"];
        const values: any[] = [updatedBy, uid, tenantUid];
        let paramIndex = 4;

        if (data.name !== undefined) {
            fields.push(`name = $${paramIndex++}`);
            values.push(data.name);
        }
        if (data.description !== undefined) {
            fields.push(`description = $${paramIndex++}`);
            values.push(data.description ?? null);
        }
        if (data.allowedExtensions !== undefined) {
            fields.push(`allowed_extensions = $${paramIndex++}`);
            values.push(data.allowedExtensions);
        }
        if (data.allowMultiple !== undefined) {
            fields.push(`allow_multiple = $${paramIndex++}`);
            values.push(data.allowMultiple);
        }
        if (data.isRequired !== undefined) {
            fields.push(`is_required = $${paramIndex++}`);
            values.push(data.isRequired);
        }
        if (data.isActive !== undefined) {
            fields.push(`is_active = $${paramIndex++}`);
            values.push(data.isActive);
        }

        const query = `
            UPDATE product_document_types
            SET ${fields.join(", ")}
            WHERE uid = $2 AND tenant_uid = $3 AND is_deleted = 0
            RETURNING id, uid, tenant_uid, name, description, allowed_extensions, allow_multiple, is_required, is_active, is_deleted, created_at, updated_at, created_by, updated_by, deleted_by
        `;

        const result = client
            ? await client.query(query, values)
            : await this.pool.query(query, values);
            
        return this.mapRowToProductDocumentType(result.rows[0]);
    }

    async softDelete(tenantUid: string, uid: string, deletedBy: string, client?: PoolClient): Promise<boolean> {
        const query = `
            UPDATE product_document_types
            SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP, deleted_by = $1
            WHERE uid = $2 AND tenant_uid = $3 AND is_deleted = 0
        `;
        const result = client
            ? await client.query(query, [deletedBy, uid, tenantUid])
            : await this.pool.query(query, [deletedBy, uid, tenantUid]);
            
        return result.rowCount !== 0;
    }

    async restore(tenantUid: string, uid: string, updatedBy: string, client?: PoolClient): Promise<boolean> {
        const query = `
            UPDATE product_document_types
            SET is_deleted = 0, deleted_at = NULL, deleted_by = NULL, updated_at = CURRENT_TIMESTAMP, updated_by = $1
            WHERE uid = $2 AND tenant_uid = $3 AND is_deleted = 1
        `;
        const result = client
            ? await client.query(query, [updatedBy, uid, tenantUid])
            : await this.pool.query(query, [updatedBy, uid, tenantUid]);
            
        return result.rowCount !== 0;
    }
}

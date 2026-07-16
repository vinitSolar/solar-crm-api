import type { Pool, PoolClient } from "pg";
import { v4 as uuidv4 } from "uuid";
import type {
    IFranchiseDocumentType,
    ICreateFranchiseDocumentType,
    IUpdateFranchiseDocumentType,
} from "../interfaces/franchise-document-type.interface.js";

const FRANCHISE_DOCUMENT_TYPE_COLUMNS = `
    fdt.id, fdt.uid, fdt.tenant_uid AS "tenantUid", fdt.name, fdt.description,
    fdt.allow_multiple AS "allowMultiple", fdt.is_required AS "isRequired",
    fdt.sort_order AS "sortOrder", fdt.is_active AS "isActive", fdt.is_deleted AS "isDeleted",
    fdt.deleted_at AS "deletedAt", fdt.created_at AS "createdAt", fdt.updated_at AS "updatedAt",
    fdt.created_by AS "createdBy", fdt.updated_by AS "updatedBy", fdt.deleted_by AS "deletedBy"
`;

export class FranchiseDocumentTypeRepository {
    private readonly pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    private mapRow(row: any): IFranchiseDocumentType {
        return {
            id: row.id,
            uid: row.uid,
            tenantUid: row.tenantUid || row.tenant_uid,
            name: row.name,
            description: row.description,
            allowMultiple: row.allowMultiple ?? row.allow_multiple,
            isRequired: row.isRequired ?? row.is_required,
            sortOrder: row.sortOrder ?? row.sort_order,
            isActive: row.isActive ?? row.is_active,
            isDeleted: row.isDeleted ?? row.is_deleted,
            createdAt: row.createdAt || row.created_at,
            updatedAt: row.updatedAt || row.updated_at,
            createdBy: row.createdBy || row.created_by,
            updatedBy: row.updatedBy || row.updated_by,
            deletedBy: row.deletedBy || row.deleted_by,
        };
    }

    async create(
        tenantUid: string,
        data: ICreateFranchiseDocumentType,
        createdBy: string,
        client?: PoolClient
    ): Promise<IFranchiseDocumentType> {
        const uid = uuidv4();
        const query = `
            INSERT INTO franchise_document_types (
                uid, tenant_uid, name, description, allow_multiple, is_required, sort_order, created_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING ${FRANCHISE_DOCUMENT_TYPE_COLUMNS.replace(/fdt\./g, "")}
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

        const result = client
            ? await client.query(query, values)
            : await this.pool.query(query, values);

        return this.mapRow(result.rows[0]);
    }

    async getByUid(tenantUid: string, uid: string, client?: PoolClient): Promise<IFranchiseDocumentType | null> {
        const query = `
            SELECT ${FRANCHISE_DOCUMENT_TYPE_COLUMNS}
            FROM franchise_document_types fdt
            WHERE fdt.uid = $1 AND fdt.tenant_uid = $2 AND fdt.is_deleted = 0
        `;
        const result = client
            ? await client.query(query, [uid, tenantUid])
            : await this.pool.query(query, [uid, tenantUid]);

        return result.rows.length > 0 ? this.mapRow(result.rows[0]) : null;
    }

    async findByTenantAndName(
        tenantUid: string,
        name: string,
        client?: PoolClient
    ): Promise<IFranchiseDocumentType | null> {
        const query = `
            SELECT ${FRANCHISE_DOCUMENT_TYPE_COLUMNS}
            FROM franchise_document_types fdt
            WHERE fdt.tenant_uid = $1 AND fdt.name = $2 AND fdt.is_deleted = 0
        `;
        const result = client
            ? await client.query(query, [tenantUid, name])
            : await this.pool.query(query, [tenantUid, name]);

        return result.rows.length > 0 ? this.mapRow(result.rows[0]) : null;
    }

    async getPaginated(
        tenantUid: string,
        page: number,
        limit: number,
        search?: string,
        status?: string
    ) {
        const offset = (page - 1) * limit;
        let whereClause = `WHERE fdt.tenant_uid = $1`;
        const values: any[] = [tenantUid];
        let paramIndex = 2;

        if (status === "deleted") {
            whereClause += ` AND fdt.is_deleted = 1`;
        } else if (status === "all") {
            // no filter
        } else {
            whereClause += ` AND fdt.is_deleted = 0`;
        }

        if (search) {
            whereClause += ` AND fdt.name ILIKE $${paramIndex++}`;
            values.push(`%${search}%`);
        }

        const countQuery = `SELECT COUNT(*) FROM franchise_document_types fdt ${whereClause}`;
        const dataQuery = `
            SELECT ${FRANCHISE_DOCUMENT_TYPE_COLUMNS}
            FROM franchise_document_types fdt
            ${whereClause}
            ORDER BY fdt.sort_order ASC, fdt.created_at DESC
            LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `;

        const countResult = await this.pool.query(countQuery, values.slice(0, paramIndex - 3));
        const total = parseInt(countResult.rows[0]?.count ?? "0", 10);

        values.push(limit, offset);
        const dataResult = await this.pool.query(dataQuery, values);

        return {
            total,
            rows: dataResult.rows.map((row: any) => this.mapRow(row)),
        };
    }

    async getAll(tenantUid: string, status?: string): Promise<IFranchiseDocumentType[]> {
        let whereClause = `WHERE fdt.tenant_uid = $1`;

        if (status === "deleted") {
            whereClause += ` AND fdt.is_deleted = 1`;
        } else if (status === "all") {
            // no filter
        } else {
            whereClause += ` AND fdt.is_deleted = 0`;
        }

        const query = `
            SELECT ${FRANCHISE_DOCUMENT_TYPE_COLUMNS}
            FROM franchise_document_types fdt
            ${whereClause}
            ORDER BY fdt.sort_order ASC, fdt.name ASC
        `;
        const result = await this.pool.query(query, [tenantUid]);
        return result.rows.map((row: any) => this.mapRow(row));
    }

    async findAllActive(tenantUid: string, client?: PoolClient): Promise<IFranchiseDocumentType[]> {
        const query = `
            SELECT ${FRANCHISE_DOCUMENT_TYPE_COLUMNS}
            FROM franchise_document_types fdt
            WHERE fdt.tenant_uid = $1 AND fdt.is_deleted = 0 AND fdt.is_active = 1
            ORDER BY fdt.sort_order ASC, fdt.name ASC
        `;
        const result = client
            ? await client.query(query, [tenantUid])
            : await this.pool.query(query, [tenantUid]);

        return result.rows.map((row: any) => this.mapRow(row));
    }

    async update(
        tenantUid: string,
        uid: string,
        data: IUpdateFranchiseDocumentType,
        updatedBy: string,
        client?: PoolClient
    ): Promise<IFranchiseDocumentType> {
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

        const query = `
            UPDATE franchise_document_types
            SET ${fields.join(", ")}
            WHERE uid = $2 AND tenant_uid = $3 AND is_deleted = 0
            RETURNING ${FRANCHISE_DOCUMENT_TYPE_COLUMNS.replace(/fdt\./g, "")}
        `;

        const result = client
            ? await client.query(query, values)
            : await this.pool.query(query, values);

        return this.mapRow(result.rows[0]);
    }

    async softDelete(tenantUid: string, uid: string, deletedBy: string, client?: PoolClient): Promise<boolean> {
        const query = `
            UPDATE franchise_document_types
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
            UPDATE franchise_document_types
            SET is_deleted = 0, deleted_at = NULL, deleted_by = NULL,
                updated_at = CURRENT_TIMESTAMP, updated_by = $1
            WHERE uid = $2 AND tenant_uid = $3 AND is_deleted = 1
        `;
        const result = client
            ? await client.query(query, [updatedBy, uid, tenantUid])
            : await this.pool.query(query, [updatedBy, uid, tenantUid]);

        return result.rowCount !== 0;
    }
}

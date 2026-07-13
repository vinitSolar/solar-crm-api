import { Pool } from "pg";
import pool from "@packages/connection.js";
import type { IQuotationScopeOfWork } from "../interfaces/quotation-scope-of-work.interface.js";
import type { CreateQuotationScopeOfWorkDTO, UpdateQuotationScopeOfWorkDTO } from "../dto/quotation-scope-of-work.dto.js";

export class QuotationScopeOfWorkRepository {
    private readonly db: Pool;

    constructor() {
        this.db = pool;
    }

    async create(
        tenantUid: string,
        data: CreateQuotationScopeOfWorkDTO,
        createdBy: string
    ): Promise<IQuotationScopeOfWork> {
        const query = `
            INSERT INTO quotation_scope_of_work 
            (tenant_uid, title, value, sort_order, is_default, created_by, updated_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;

        const values = [
            tenantUid,
            data.title,
            data.value,
            data.sortOrder ?? 0,
            data.isDefault ?? 0,
            createdBy,
            createdBy,
        ];

        const result = await this.db.query(query, values);
        return this.mapToCamelCase(result.rows[0]);
    }

    async findByUid(tenantUid: string, uid: string): Promise<IQuotationScopeOfWork | null> {
        const query = `
            SELECT * FROM quotation_scope_of_work
            WHERE tenant_uid = $1 AND uid = $2 AND is_deleted = 0
        `;
        const result = await this.db.query(query, [tenantUid, uid]);

        if (result.rows.length === 0) {
            return null;
        }

        return this.mapToCamelCase(result.rows[0]);
    }

    async findByTitle(tenantUid: string, title: string): Promise<IQuotationScopeOfWork | null> {
        const query = `
            SELECT * FROM quotation_scope_of_work
            WHERE tenant_uid = $1 AND LOWER(title) = LOWER($2) AND is_deleted = 0
        `;
        const result = await this.db.query(query, [tenantUid, title]);

        if (result.rows.length === 0) {
            return null;
        }

        return this.mapToCamelCase(result.rows[0]);
    }

    async update(
        tenantUid: string,
        uid: string,
        data: UpdateQuotationScopeOfWorkDTO,
        updatedBy: string
    ): Promise<IQuotationScopeOfWork | null> {
        const setClauses: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        const addField = (field: string, value: any) => {
            if (value !== undefined) {
                setClauses.push(`${field} = $${paramIndex}`);
                values.push(value);
                paramIndex++;
            }
        };

        addField("title", data.title);
        addField("value", data.value);
        addField("sort_order", data.sortOrder);
        addField("is_active", data.isActive);

        if (setClauses.length === 0) {
            return this.findByUid(tenantUid, uid);
        }

        setClauses.push(`updated_by = $${paramIndex}`);
        values.push(updatedBy);
        paramIndex++;

        setClauses.push(`updated_at = CURRENT_TIMESTAMP`);

        const query = `
            UPDATE quotation_scope_of_work
            SET ${setClauses.join(", ")}
            WHERE tenant_uid = $${paramIndex} AND uid = $${paramIndex + 1} AND is_deleted = 0
            RETURNING *
        `;

        values.push(tenantUid, uid);

        const result = await this.db.query(query, values);

        if (result.rows.length === 0) {
            return null;
        }

        return this.mapToCamelCase(result.rows[0]);
    }

    async list(
        tenantUid: string,
        page: number,
        limit: number,
        search?: string,
        status: "active" | "deleted" | "all" = "active",
        sortBy: "sort_order" | "created_at" = "sort_order",
        sortDir: "asc" | "desc" = "asc"
    ): Promise<{ data: IQuotationScopeOfWork[]; total: number }> {
        const offset = (page - 1) * limit;
        const values: any[] = [tenantUid];
        let paramIndex = 2;

        let whereClause = "WHERE tenant_uid = $1";

        if (status !== "all") {
            whereClause += ` AND is_deleted = ${status === "deleted" ? 1 : 0}`;
            
            if (status === "active") {
                whereClause += ` AND is_active = 1`;
            }
        }

        if (search) {
            whereClause += ` AND (LOWER(title) LIKE $${paramIndex} OR LOWER(value) LIKE $${paramIndex})`;
            values.push(`%${search.toLowerCase()}%`);
            paramIndex++;
        }

        const validSortColumns = {
            sort_order: "sort_order",
            created_at: "created_at",
        };
        const orderColumn = validSortColumns[sortBy as keyof typeof validSortColumns] || "sort_order";
        const orderDirection = sortDir === "desc" ? "DESC" : "ASC";

        const countQuery = `SELECT COUNT(*) as total FROM quotation_scope_of_work ${whereClause}`;
        const dataQuery = `
            SELECT * FROM quotation_scope_of_work 
            ${whereClause} 
            ORDER BY ${orderColumn} ${orderDirection} 
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        const [countResult, dataResult] = await Promise.all([
            this.db.query(countQuery, values.slice(0, paramIndex - 1)),
            this.db.query(dataQuery, [...values, limit, offset]),
        ]);

        return {
            data: dataResult.rows.map(this.mapToCamelCase),
            total: parseInt(countResult.rows[0]?.total || "0", 10),
        };
    }

    async findAllActive(tenantUid: string): Promise<IQuotationScopeOfWork[]> {
        const query = `
            SELECT * FROM quotation_scope_of_work
            WHERE tenant_uid = $1 AND is_deleted = 0 AND is_active = 1
            ORDER BY sort_order ASC
        `;
        const result = await this.db.query(query, [tenantUid]);
        return result.rows.map(this.mapToCamelCase);
    }

    async softDelete(tenantUid: string, uid: string, deletedBy: string): Promise<boolean> {
        // There is no deleted_at in the migration script, but `is_deleted` and `deleted_by` are there
        // Actually, the migration didn't include deleted_at but included deleted_by.
        // Wait, standard base fields usually have deleted_at or not? The migration script only added is_deleted, created_at, updated_at, created_by, updated_by, deleted_by. Let me check the migration I just created.
        const query = `
            UPDATE quotation_scope_of_work
            SET is_deleted = 1, deleted_by = $1, is_active = 0
            WHERE tenant_uid = $2 AND uid = $3 AND is_deleted = 0
            RETURNING uid
        `;
        const result = await this.db.query(query, [deletedBy, tenantUid, uid]);
        return (result.rowCount ?? 0) > 0;
    }

    async restore(tenantUid: string, uid: string, updatedBy: string): Promise<boolean> {
        const query = `
            UPDATE quotation_scope_of_work
            SET is_deleted = 0, is_active = 1, updated_by = $1, updated_at = CURRENT_TIMESTAMP
            WHERE tenant_uid = $2 AND uid = $3 AND is_deleted = 1
            RETURNING uid
        `;
        const result = await this.db.query(query, [updatedBy, tenantUid, uid]);
        return (result.rowCount ?? 0) > 0;
    }

    private mapToCamelCase(row: any): IQuotationScopeOfWork {
        return {
            uid: row.uid,
            tenantUid: row.tenant_uid,
            title: row.title,
            value: row.value,
            sortOrder: row.sort_order,
            isDefault: row.is_default,
            isActive: row.is_active,
            isDeleted: row.is_deleted,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            createdBy: row.created_by,
            updatedBy: row.updated_by,
            deletedBy: row.deleted_by,
        };
    }
}

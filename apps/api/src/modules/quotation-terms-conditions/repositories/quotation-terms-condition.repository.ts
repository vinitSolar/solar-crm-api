import { Pool } from "pg";
import pool from "@packages/connection.js";
import type { IQuotationTermsCondition } from "../interfaces/quotation-terms-condition.interface.js";
import type { CreateQuotationTermsConditionDTO, UpdateQuotationTermsConditionDTO } from "../dto/quotation-terms-condition.dto.js";

export class QuotationTermsConditionRepository {
    private readonly db: Pool;

    constructor() {
        this.db = pool;
    }

    async create(
        tenantUid: string,
        data: CreateQuotationTermsConditionDTO,
        createdBy: string
    ): Promise<IQuotationTermsCondition> {
        let sortOrder = data.sortOrder;
        if (sortOrder === undefined || sortOrder === null) {
            const maxRes = await this.db.query(
                `SELECT COALESCE(MAX(sort_order), 0) AS max_sort FROM quotation_terms_conditions WHERE tenant_uid = $1 AND is_deleted = 0`,
                [tenantUid]
            );
            sortOrder = Number(maxRes.rows[0]?.max_sort || 0) + 1;
        }

        if (data.isDefault === 1) {
            await this.db.query(
                `UPDATE quotation_terms_conditions SET is_default = 0 WHERE tenant_uid = $1 AND is_default = 1`,
                [tenantUid]
            );
        }

        const query = `
            INSERT INTO quotation_terms_conditions 
            (tenant_uid, title, description, sort_order, is_default, created_by, updated_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;

        const values = [
            tenantUid,
            data.title,
            data.description,
            sortOrder,
            data.isDefault ?? 0,
            createdBy,
            createdBy,
        ];

        const result = await this.db.query(query, values);
        return this.mapToCamelCase(result.rows[0]);
    }

    async findByUid(tenantUid: string, uid: string): Promise<IQuotationTermsCondition | null> {
        const query = `
            SELECT * FROM quotation_terms_conditions
            WHERE tenant_uid = $1 AND uid = $2 AND is_deleted = 0
        `;
        const result = await this.db.query(query, [tenantUid, uid]);

        if (result.rows.length === 0) {
            return null;
        }

        return this.mapToCamelCase(result.rows[0]);
    }

    async findByTitle(tenantUid: string, title: string): Promise<IQuotationTermsCondition | null> {
        const query = `
            SELECT * FROM quotation_terms_conditions
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
        data: UpdateQuotationTermsConditionDTO,
        updatedBy: string
    ): Promise<IQuotationTermsCondition | null> {
        if (data.isDefault === 1) {
            await this.db.query(
                `UPDATE quotation_terms_conditions SET is_default = 0 WHERE tenant_uid = $1 AND is_default = 1 AND uid != $2`,
                [tenantUid, uid]
            );
        }

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
        addField("description", data.description);
        addField("sort_order", data.sortOrder);
        addField("is_default", data.isDefault);
        addField("is_active", data.isActive);

        if (setClauses.length === 0) {
            return this.findByUid(tenantUid, uid);
        }

        setClauses.push(`updated_by = $${paramIndex}`);
        values.push(updatedBy);
        paramIndex++;

        setClauses.push(`updated_at = CURRENT_TIMESTAMP`);

        const query = `
            UPDATE quotation_terms_conditions
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
    ): Promise<{ data: IQuotationTermsCondition[]; total: number }> {
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
            whereClause += ` AND (LOWER(title) LIKE $${paramIndex} OR LOWER(description) LIKE $${paramIndex})`;
            values.push(`%${search.toLowerCase()}%`);
            paramIndex++;
        }

        const validSortColumns = {
            sort_order: "sort_order",
            created_at: "created_at",
        };
        const orderColumn = validSortColumns[sortBy] || "sort_order";
        const orderDirection = sortDir === "desc" ? "DESC" : "ASC";

        const countQuery = `SELECT COUNT(*) as total FROM quotation_terms_conditions ${whereClause}`;
        const dataQuery = `
            SELECT * FROM quotation_terms_conditions 
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

    async findAllActive(tenantUid: string): Promise<IQuotationTermsCondition[]> {
        const query = `
            SELECT * FROM quotation_terms_conditions
            WHERE tenant_uid = $1 AND is_deleted = 0 AND is_active = 1
            ORDER BY sort_order ASC
        `;
        const result = await this.db.query(query, [tenantUid]);
        return result.rows.map(this.mapToCamelCase);
    }

    async softDelete(tenantUid: string, uid: string, deletedBy: string): Promise<boolean> {
        const query = `
            UPDATE quotation_terms_conditions
            SET is_deleted = 1, deleted_by = $1, deleted_at = CURRENT_TIMESTAMP, is_active = 0
            WHERE tenant_uid = $2 AND uid = $3 AND is_deleted = 0
            RETURNING uid
        `;
        const result = await this.db.query(query, [deletedBy, tenantUid, uid]);
        return (result.rowCount ?? 0) > 0;
    }

    private mapToCamelCase(row: any): IQuotationTermsCondition {
        return {
            uid: row.uid,
            tenantUid: row.tenant_uid,
            title: row.title,
            description: row.description,
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

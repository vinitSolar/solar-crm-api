import type { Pool, PoolClient } from "pg";
import type { ILeadSource, ICreateLeadSource, IUpdateLeadSource } from "../interfaces/lead.interface.js";
import { v4 as uuidv4 } from "uuid";

const LEAD_SOURCE_COLUMNS = `
    id, uid, tenant_uid AS "tenantUid", name, color, sort_order AS "sortOrder", 
    is_default AS "isDefault", is_active AS "isActive", is_deleted AS "isDeleted",
    created_at AS "createdAt", updated_at AS "updatedAt",
    created_by AS "createdBy", updated_by AS "updatedBy", deleted_by AS "deletedBy"
`;

export class LeadSourceRepository {
    private readonly pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    async create(
        tenantUid: string,
        data: ICreateLeadSource,
        createdBy: string,
        client?: PoolClient
    ): Promise<ILeadSource> {
        const uid = uuidv4();
        const executor = client || this.pool;

        let sortOrder = data.sortOrder;
        if (sortOrder === undefined || sortOrder === null) {
            const maxRes = await executor.query(
                `SELECT COALESCE(MAX(sort_order), 0) AS max_sort FROM lead_sources WHERE tenant_uid = $1 AND is_deleted = 0`,
                [tenantUid]
            );
            sortOrder = Number(maxRes.rows[0]?.max_sort || 0) + 1;
        }

        if (data.isDefault === 1) {
            await executor.query(
                `UPDATE lead_sources SET is_default = 0 WHERE tenant_uid = $1 AND is_default = 1`,
                [tenantUid]
            );
        }

        const query = `
            INSERT INTO lead_sources (uid, tenant_uid, name, color, sort_order, is_default, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING ${LEAD_SOURCE_COLUMNS}
        `;
        const values = [
            uid, tenantUid, data.name, data.color ?? null, sortOrder, 
            data.isDefault ?? 0, createdBy
        ];

        const result = await executor.query(query, values);
            
        return result.rows[0] as ILeadSource;
    }

    async getByUid(tenantUid: string, uid: string): Promise<ILeadSource | null> {
        const result = await this.pool.query(
            `SELECT ${LEAD_SOURCE_COLUMNS} FROM lead_sources 
             WHERE uid = $1 AND tenant_uid = $2 AND is_deleted = 0`,
            [uid, tenantUid]
        );
        return result.rows.length > 0 ? (result.rows[0] as ILeadSource) : null;
    }

    async getAll(tenantUid: string, status: "active" | "deleted" | "all" = "active"): Promise<ILeadSource[]> {
        let whereClause = "tenant_uid = $1";
        if (status === "active") whereClause += " AND is_deleted = 0";
        else if (status === "deleted") whereClause += " AND is_deleted = 1";

        const result = await this.pool.query(
            `SELECT ${LEAD_SOURCE_COLUMNS} FROM lead_sources 
             WHERE ${whereClause} 
             ORDER BY sort_order ASC, created_at DESC`,
            [tenantUid]
        );
        return result.rows as ILeadSource[];
    }

    async update(tenantUid: string, uid: string, data: IUpdateLeadSource, updatedBy: string): Promise<ILeadSource | null> {
        if (data.isDefault === 1) {
            await this.pool.query(
                `UPDATE lead_sources SET is_default = 0 WHERE tenant_uid = $1 AND is_default = 1 AND uid != $2`,
                [tenantUid, uid]
            );
        }

        const updates: string[] = [];
        const values: any[] = [];
        let index = 1;

        if (data.name !== undefined) { updates.push(`name = $${index++}`); values.push(data.name); }
        if (data.color !== undefined) { updates.push(`color = $${index++}`); values.push(data.color); }
        if (data.sortOrder !== undefined) { updates.push(`sort_order = $${index++}`); values.push(data.sortOrder); }
        if (data.isDefault !== undefined) { updates.push(`is_default = $${index++}`); values.push(data.isDefault); }

        if (updates.length === 0) return this.getByUid(tenantUid, uid);

        updates.push(`updated_by = $${index++}`);
        values.push(updatedBy);
        updates.push(`updated_at = CURRENT_TIMESTAMP`);

        values.push(uid, tenantUid);

        const result = await this.pool.query(
            `UPDATE lead_sources SET ${updates.join(", ")}
             WHERE uid = $${index - 2} AND tenant_uid = $${index - 1} AND is_deleted = 0
             RETURNING ${LEAD_SOURCE_COLUMNS}`,
            values
        );
        return result.rows.length > 0 ? (result.rows[0] as ILeadSource) : null;
    }

    async softDelete(tenantUid: string, uid: string, deletedBy: string): Promise<boolean> {
        const result = await this.pool.query(
            `UPDATE lead_sources 
             SET is_deleted = 1, deleted_by = $1, updated_at = CURRENT_TIMESTAMP
             WHERE uid = $2 AND tenant_uid = $3 AND is_deleted = 0`,
            [deletedBy, uid, tenantUid]
        );
        return (result.rowCount ?? 0) > 0;
    }

    async restore(tenantUid: string, uid: string, updatedBy: string): Promise<boolean> {
        const result = await this.pool.query(
            `UPDATE lead_sources 
             SET is_deleted = 0, deleted_by = NULL, updated_by = $1, updated_at = CURRENT_TIMESTAMP
             WHERE uid = $2 AND tenant_uid = $3 AND is_deleted = 1`,
            [updatedBy, uid, tenantUid]
        );
        return (result.rowCount ?? 0) > 0;
    }
}

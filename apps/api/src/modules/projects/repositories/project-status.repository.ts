import type { Pool, PoolClient } from "pg";
import type { IProjectStatus, ICreateProjectStatus, IUpdateProjectStatus } from "../interfaces/project.interface.js";
import { v4 as uuidv4 } from "uuid";

const PROJECT_STATUS_COLUMNS = `
    id, uid, tenant_uid AS "tenantUid", name, color, sort_order AS "sortOrder", 
    is_default AS "isDefault", is_closed AS "isClosed", description, is_active AS "isActive", 
    is_deleted AS "isDeleted", created_at AS "createdAt", updated_at AS "updatedAt",
    created_by AS "createdBy", updated_by AS "updatedBy", deleted_by AS "deletedBy"
`;

export class ProjectStatusRepository {
    private readonly pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    async create(
        tenantUid: string,
        data: ICreateProjectStatus,
        createdBy: string,
        client?: PoolClient
    ): Promise<IProjectStatus> {
        const uid = uuidv4();
        const executor = client || this.pool;

        let sortOrder = data.sortOrder;
        if (sortOrder === undefined || sortOrder === null) {
            const maxRes = await executor.query(
                `SELECT COALESCE(MAX(sort_order), 0) AS max_sort FROM project_statuses WHERE tenant_uid = $1 AND is_deleted = 0`,
                [tenantUid]
            );
            sortOrder = Number(maxRes.rows[0]?.max_sort || 0) + 1;
        }

        if (data.isDefault === 1) {
            await executor.query(
                `UPDATE project_statuses SET is_default = 0 WHERE tenant_uid = $1 AND is_default = 1`,
                [tenantUid]
            );
        }

        const query = `
            INSERT INTO project_statuses (uid, tenant_uid, name, color, sort_order, is_default, is_closed, description, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING ${PROJECT_STATUS_COLUMNS}
        `;
        const values = [
            uid, tenantUid, data.name, data.color ?? null, sortOrder, 
            data.isDefault ?? 0, data.isClosed ?? 0, data.description ?? null, createdBy
        ];

        const result = await executor.query(query, values);
            
        return result.rows[0] as IProjectStatus;
    }

    async getByUid(tenantUid: string, uid: string): Promise<IProjectStatus | null> {
        const result = await this.pool.query(
            `SELECT ${PROJECT_STATUS_COLUMNS} FROM project_statuses 
             WHERE uid = $1 AND tenant_uid = $2 AND is_deleted = 0`,
            [uid, tenantUid]
        );
        return result.rows.length > 0 ? (result.rows[0] as IProjectStatus) : null;
    }

    async getAll(tenantUid: string, status: "active" | "deleted" | "all" = "active"): Promise<IProjectStatus[]> {
        let whereClause = "tenant_uid = $1";
        if (status === "active") whereClause += " AND is_deleted = 0";
        else if (status === "deleted") whereClause += " AND is_deleted = 1";

        const result = await this.pool.query(
            `SELECT ${PROJECT_STATUS_COLUMNS} FROM project_statuses 
             WHERE ${whereClause} 
             ORDER BY sort_order ASC, created_at DESC`,
            [tenantUid]
        );
        return result.rows as IProjectStatus[];
    }

    async getDefault(tenantUid: string): Promise<IProjectStatus | null> {
        const result = await this.pool.query(
            `SELECT ${PROJECT_STATUS_COLUMNS} FROM project_statuses 
             WHERE tenant_uid = $1 AND is_deleted = 0 AND is_default = 1
             ORDER BY created_at ASC LIMIT 1`,
            [tenantUid]
        );
        return result.rows.length > 0 ? (result.rows[0] as IProjectStatus) : null;
    }

    async update(tenantUid: string, uid: string, data: IUpdateProjectStatus, updatedBy: string): Promise<IProjectStatus | null> {
        if (data.isDefault === 1) {
            await this.pool.query(
                `UPDATE project_statuses SET is_default = 0 WHERE tenant_uid = $1 AND is_default = 1 AND uid != $2`,
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
        if (data.isClosed !== undefined) { updates.push(`is_closed = $${index++}`); values.push(data.isClosed); }
        if (data.description !== undefined) { updates.push(`description = $${index++}`); values.push(data.description); }

        if (updates.length === 0) return this.getByUid(tenantUid, uid);

        updates.push(`updated_by = $${index++}`);
        values.push(updatedBy);
        updates.push(`updated_at = CURRENT_TIMESTAMP`);

        values.push(uid, tenantUid);

        const result = await this.pool.query(
            `UPDATE project_statuses SET ${updates.join(", ")}
             WHERE uid = $${index - 2} AND tenant_uid = $${index - 1} AND is_deleted = 0
             RETURNING ${PROJECT_STATUS_COLUMNS}`,
            values
        );
        return result.rows.length > 0 ? (result.rows[0] as IProjectStatus) : null;
    }

    async softDelete(tenantUid: string, uid: string, deletedBy: string): Promise<boolean> {
        const result = await this.pool.query(
            `UPDATE project_statuses 
             SET is_deleted = 1, deleted_by = $1, updated_at = CURRENT_TIMESTAMP
             WHERE uid = $2 AND tenant_uid = $3 AND is_deleted = 0`,
            [deletedBy, uid, tenantUid]
        );
        return (result.rowCount ?? 0) > 0;
    }

    async restore(tenantUid: string, uid: string, updatedBy: string): Promise<boolean> {
        const result = await this.pool.query(
            `UPDATE project_statuses 
             SET is_deleted = 0, deleted_by = NULL, updated_by = $1, updated_at = CURRENT_TIMESTAMP
             WHERE uid = $2 AND tenant_uid = $3 AND is_deleted = 1`,
            [updatedBy, uid, tenantUid]
        );
        return (result.rowCount ?? 0) > 0;
    }
}

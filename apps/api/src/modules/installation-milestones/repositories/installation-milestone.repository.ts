import type { Pool, PoolClient } from "pg";
import type { IInstallationMilestone, ICreateInstallationMilestone, IUpdateInstallationMilestone } from "../interfaces/installation-milestone.interface.js";
import { v4 as uuidv4 } from "uuid";

const INSTALLATION_MILESTONE_COLUMNS = `
    id, uid, tenant_uid AS "tenantUid", name, description, sort_order AS "sortOrder", 
    requires_document AS "requiresDocument", allow_multiple_images AS "allowMultipleImages", 
    is_system AS "isSystem", is_active AS "isActive", is_deleted AS "isDeleted", 
    created_at AS "createdAt", updated_at AS "updatedAt",
    created_by AS "createdBy", updated_by AS "updatedBy", deleted_by AS "deletedBy"
`;

export class InstallationMilestoneRepository {
    private readonly pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    async create(
        tenantUid: string,
        data: ICreateInstallationMilestone,
        createdBy: string,
        client?: PoolClient
    ): Promise<IInstallationMilestone> {
        const uid = uuidv4();
        const executor = client || this.pool;

        let sortOrder = data.sortOrder;
        if (sortOrder === undefined || sortOrder === null) {
            const maxRes = await executor.query(
                `SELECT COALESCE(MAX(sort_order), 0) AS max_sort FROM installation_milestones WHERE tenant_uid::varchar = $1 AND is_deleted = 0`,
                [tenantUid]
            );
            sortOrder = Number(maxRes.rows[0]?.max_sort || 0) + 10;
        }

        const query = `
            INSERT INTO installation_milestones (uid, tenant_uid, name, description, sort_order, requires_document, allow_multiple_images, created_by)
            VALUES ($1, $2, $3, $4, $5::int, $6::smallint, $7::smallint, $8)
            RETURNING ${INSTALLATION_MILESTONE_COLUMNS}
        `;
        const values = [
            uid, tenantUid, data.name, data.description || null, sortOrder, 
            data.requiresDocument ?? 0, data.allowMultipleImages ?? 0, createdBy
        ];

        const result = await executor.query(query, values);
        return result.rows[0] as IInstallationMilestone;
    }

    async getByUid(tenantUid: string, uid: string): Promise<IInstallationMilestone | null> {
        const result = await this.pool.query(
            `SELECT ${INSTALLATION_MILESTONE_COLUMNS} FROM installation_milestones 
             WHERE uid::varchar = $1 AND tenant_uid::varchar = $2 AND is_deleted = 0`,
            [uid, tenantUid]
        );
        return result.rows.length > 0 ? (result.rows[0] as IInstallationMilestone) : null;
    }

    async getAll(tenantUid: string, status: "active" | "deleted" | "all" = "active"): Promise<IInstallationMilestone[]> {
        let whereClause = "tenant_uid::varchar = $1";
        if (status === "active") whereClause += " AND is_deleted = 0";
        else if (status === "deleted") whereClause += " AND is_deleted = 1";

        const result = await this.pool.query(
            `SELECT ${INSTALLATION_MILESTONE_COLUMNS} FROM installation_milestones 
             WHERE ${whereClause} 
             ORDER BY sort_order ASC, created_at DESC`,
            [tenantUid]
        );
        return result.rows as IInstallationMilestone[];
    }

    async update(tenantUid: string, uid: string, data: IUpdateInstallationMilestone, updatedBy: string): Promise<IInstallationMilestone | null> {
        const updates: string[] = [];
        const values: any[] = [];
        let index = 1;

        if (data.name !== undefined) { updates.push(`name = $${index++}`); values.push(data.name); }
        if (data.description !== undefined) { updates.push(`description = $${index++}`); values.push(data.description); }
        if (data.sortOrder !== undefined) { updates.push(`sort_order = $${index++}::int`); values.push(data.sortOrder); }
        if (data.requiresDocument !== undefined) { updates.push(`requires_document = $${index++}::smallint`); values.push(data.requiresDocument); }
        if (data.allowMultipleImages !== undefined) { updates.push(`allow_multiple_images = $${index++}::smallint`); values.push(data.allowMultipleImages); }

        if (updates.length === 0) return this.getByUid(tenantUid, uid);

        updates.push(`updated_by = $${index++}`);
        values.push(updatedBy);
        updates.push(`updated_at = CURRENT_TIMESTAMP`);

        values.push(uid, tenantUid);

        const result = await this.pool.query(
            `UPDATE installation_milestones SET ${updates.join(", ")}
             WHERE uid::varchar = $${index} AND tenant_uid::varchar = $${index + 1} AND is_deleted = 0
             RETURNING ${INSTALLATION_MILESTONE_COLUMNS}`,
            values
        );
        return result.rows.length > 0 ? (result.rows[0] as IInstallationMilestone) : null;
    }

    async softDelete(tenantUid: string, uid: string, deletedBy: string): Promise<boolean> {
        const result = await this.pool.query(
            `UPDATE installation_milestones 
             SET is_deleted = 1, deleted_by = $1, updated_at = CURRENT_TIMESTAMP
             WHERE uid::varchar = $2 AND tenant_uid::varchar = $3 AND is_deleted = 0 AND is_system = 0`,
            [deletedBy, uid, tenantUid]
        );
        return (result.rowCount ?? 0) > 0;
    }

    async restore(tenantUid: string, uid: string, updatedBy: string): Promise<boolean> {
        const result = await this.pool.query(
            `UPDATE installation_milestones 
             SET is_deleted = 0, deleted_by = NULL, updated_by = $1, updated_at = CURRENT_TIMESTAMP
             WHERE uid::varchar = $2 AND tenant_uid::varchar = $3 AND is_deleted = 1`,
            [updatedBy, uid, tenantUid]
        );
        return (result.rowCount ?? 0) > 0;
    }
}

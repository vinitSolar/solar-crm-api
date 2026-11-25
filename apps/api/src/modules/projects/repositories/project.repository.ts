import type { Pool, PoolClient } from "pg";
import type { IProject, ICreateProject, IUpdateProject } from "../interfaces/project.interface.js";
import { v4 as uuidv4 } from "uuid";

const PROJECT_COLUMNS = `
    p.id, p.uid, p.tenant_uid AS "tenantUid", p.lead_uid AS "leadUid", p.quotation_uid AS "quotationUid",
    p.project_number AS "projectNumber", p.project_name AS "projectName", p.project_status_uid AS "projectStatusUid",
    p.project_manager_uid AS "projectManagerUid", p.project_date AS "projectDate", n.note AS "remarks",
    p.is_active AS "isActive", p.is_deleted AS "isDeleted", 
    p.created_at AS "createdAt", p.updated_at AS "updatedAt",
    p.created_by AS "createdBy", p.updated_by AS "updatedBy", p.deleted_by AS "deletedBy"
`;

const PROJECT_RELATIONS_COLUMNS = `
    ps.name AS "statusName", ps.color AS "statusColor", ps.sort_order AS "statusSortOrder", ps.is_closed AS "statusIsClosed",
    COALESCE(
        NULLIF(TRIM(CONCAT(u.first_name, ' ', COALESCE(u.last_name, ''))), ''),
        NULLIF(TRIM(CONCAT(lu.first_name, ' ', COALESCE(lu.last_name, ''))), ''),
        NULLIF(TRIM(CONCAT(cu.first_name, ' ', COALESCE(cu.last_name, ''))), ''),
        'Unassigned'
    ) AS "projectManagerName",
    COALESCE(p.project_manager_uid::varchar, l.assigned_to::varchar, p.created_by::varchar) AS "effectiveProjectManagerUid",
    l.first_name AS "customerFirstName", l.last_name AS "customerLastName", l.mobile_number AS "customerMobileNumber",
    l.address AS "customerAddress", l.city AS "customerCity", l.state AS "customerState", l.pin_code AS "customerPinCode",
    COALESCE(q.system_size, l.system_size) AS "finalSystemSize",
    COALESCE(NULLIF(q.net_customer_cost, 0), q.grand_total, 0) AS "quotedPrice"
`;

export class ProjectRepository {
    private readonly pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    async runInTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");
            const result = await fn(client);
            await client.query("COMMIT");
            return result;
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    async create(
        tenantUid: string,
        data: ICreateProject & { leadUid: string; projectNumber: string; statusUid: string },
        createdBy: string,
        client?: PoolClient
    ): Promise<IProject> {
        const uid = uuidv4();
        const query = `
            INSERT INTO projects (
                uid, tenant_uid, lead_uid, quotation_uid, project_number, project_name, 
                project_status_uid, project_manager_uid, project_date, created_by
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
            )
            RETURNING uid
        `;
        const values = [
            uid, tenantUid, data.leadUid, data.quotationUid, data.projectNumber, data.projectName, 
            data.statusUid, data.projectManagerUid || null, data.projectDate || null, createdBy
        ];

        const result = client 
            ? await client.query(query, values) 
            : await this.pool.query(query, values);
            
        const created = result.rows[0];
        if (!created) throw new Error("Failed to create project");
        
        return await this.getByUid(tenantUid, created.uid, client) as IProject;
    }

    async getByUid(tenantUid: string, uid: string, client?: PoolClient): Promise<IProject | null> {
        const query = `
             SELECT ${PROJECT_COLUMNS}, ${PROJECT_RELATIONS_COLUMNS}
             FROM projects p
             LEFT JOIN (SELECT DISTINCT ON (module_uid) module_uid, note FROM notes WHERE module = 'project' AND is_deleted = 0 ORDER BY module_uid, created_at DESC) n ON n.module_uid = p.uid::varchar
             LEFT JOIN project_statuses ps ON p.project_status_uid = ps.uid 
             LEFT JOIN users u ON p.project_manager_uid::varchar = u.uid
             LEFT JOIN leads l ON p.lead_uid::varchar = l.uid
             LEFT JOIN users lu ON l.assigned_to::varchar = lu.uid
             LEFT JOIN users cu ON p.created_by::varchar = cu.uid
             LEFT JOIN quotations q ON p.quotation_uid::varchar = q.uid
             WHERE p.uid::varchar = $1 AND p.tenant_uid::varchar = $2 AND p.is_deleted = 0
        `;
        const result = client
            ? await client.query(query, [uid, tenantUid])
            : await this.pool.query(query, [uid, tenantUid]);
        return result.rows.length > 0 ? (result.rows[0] as IProject) : null;
    }

    async getProjectLeadState(tenantUid: string, uid: string, client?: PoolClient): Promise<{ leadUid: string; state: string | null } | null> {
        const query = `
             SELECT p.lead_uid::varchar AS "leadUid", l.state
             FROM projects p
             LEFT JOIN leads l ON p.lead_uid::varchar = l.uid
             WHERE p.uid::varchar = $1 AND p.tenant_uid::varchar = $2 AND p.is_deleted = 0
        `;
        const result = client
            ? await client.query(query, [uid, tenantUid])
            : await this.pool.query(query, [uid, tenantUid]);
        return result.rows.length > 0 ? { leadUid: result.rows[0].leadUid, state: result.rows[0].state || null } : null;
    }

    async getActiveProjectByQuotationUid(tenantUid: string, quotationUid: string, client?: PoolClient): Promise<IProject | null> {
        const query = `
             SELECT p.uid::varchar AS "uid"
             FROM projects p
             WHERE p.quotation_uid::varchar = $1 AND p.tenant_uid::varchar = $2 AND p.is_deleted = 0 AND p.is_active = 1
        `;
        const result = client
            ? await client.query(query, [quotationUid, tenantUid])
            : await this.pool.query(query, [quotationUid, tenantUid]);
        return result.rows.length > 0 ? (result.rows[0] as IProject) : null;
    }

    async getProjectsByLeadUid(
        tenantUid: string,
        leadUid: string,
        client?: PoolClient
    ): Promise<Array<{ uid: string; projectStatusUid: string; statusName: string | null; isClosed: number }>> {
        const query = `
            SELECT p.uid::varchar AS "uid",
                   p.project_status_uid::varchar AS "projectStatusUid",
                   ps.name AS "statusName",
                   COALESCE(ps.is_closed, 0) AS "isClosed"
            FROM projects p
            LEFT JOIN project_statuses ps ON p.project_status_uid = ps.uid
            WHERE p.lead_uid::varchar = $1 AND p.tenant_uid::varchar = $2 AND p.is_deleted = 0
            ORDER BY p.created_at DESC
        `;
        const result = client
            ? await client.query(query, [leadUid, tenantUid])
            : await this.pool.query(query, [leadUid, tenantUid]);
        return result.rows.map((row: any) => ({
            uid: String(row.uid),
            projectStatusUid: String(row.projectStatusUid || ""),
            statusName: row.statusName ?? null,
            isClosed: Number(row.isClosed) || 0,
        }));
    }

    async getLastProjectNumber(tenantUid: string, client?: PoolClient): Promise<string | null> {
        const prefix = `PRJ`;
        const query = `
            SELECT project_number 
            FROM projects 
            WHERE project_number LIKE $1 AND tenant_uid::varchar = $2
            ORDER BY id DESC 
            LIMIT 1
            FOR UPDATE
        `;
        const result = client 
            ? await client.query(query, [`${prefix}%`, tenantUid]) 
            : await this.pool.query(query, [`${prefix}%`, tenantUid]);
        return result.rows.length > 0 ? result.rows[0].project_number : null;
    }

    async generateProjectNumber(tenantUid: string, client?: PoolClient): Promise<string> {
        const prefix = `PRJ`;
        
        const lastNumber = await this.getLastProjectNumber(tenantUid, client);
        
        let nextNum = 1;
        if (lastNumber) {
            const numStr = lastNumber.replace(prefix, "");
            nextNum = parseInt(numStr, 10) + 1;
        }
        
        return `${prefix}${String(nextNum).padStart(6, "0")}`;
    }

    async getPaginated(
        tenantUid: string,
        page: number,
        limit: number,
        search?: string,
        status: "active" | "deleted" | "all" = "active",
        filters?: { projectStatusUid?: string; projectManagerUid?: string; startDate?: string; endDate?: string }
    ): Promise<{ rows: IProject[]; total: number; allCount: number; statusCounts: Record<string, number> }> {
        const baseParams: any[] = [tenantUid];
        let baseWhereClause = "p.tenant_uid::varchar = $1";

        if (status === "active") baseWhereClause += " AND p.is_deleted = 0 AND (l.is_deleted = 0 OR l.uid IS NULL)";
        else if (status === "deleted") baseWhereClause += " AND p.is_deleted = 1";

        if (filters?.projectManagerUid) {
            baseParams.push(filters.projectManagerUid);
            baseWhereClause += ` AND p.project_manager_uid::varchar = $${baseParams.length}`;
        }

        if (filters?.startDate) {
            baseParams.push(filters.startDate);
            baseWhereClause += ` AND p.project_date >= $${baseParams.length}`;
        }

        if (filters?.endDate) {
            baseParams.push(filters.endDate);
            baseWhereClause += ` AND p.project_date <= $${baseParams.length}`;
        }

        if (search) {
            baseParams.push(`%${search}%`);
            const searchIndex = baseParams.length;
            baseWhereClause += ` AND (
                p.project_number ILIKE $${searchIndex} OR
                p.project_name ILIKE $${searchIndex} OR 
                l.lead_number ILIKE $${searchIndex} OR
                l.first_name ILIKE $${searchIndex} OR
                l.last_name ILIKE $${searchIndex} OR
                l.mobile_number ILIKE $${searchIndex} OR
                u.first_name ILIKE $${searchIndex} OR
                lu.first_name ILIKE $${searchIndex} OR
                cu.first_name ILIKE $${searchIndex}
            )`;
        }

        const params: any[] = [...baseParams];
        let whereClause = baseWhereClause;

        if (filters?.projectStatusUid) {
            params.push(filters.projectStatusUid);
            whereClause += ` AND p.project_status_uid::varchar = $${params.length}`;
        }

        const statusCountsQuery = `
            SELECT p.project_status_uid::varchar AS "statusUid", COUNT(*)::int AS cnt
            FROM projects p
            LEFT JOIN users u ON p.project_manager_uid::varchar = u.uid
            LEFT JOIN leads l ON p.lead_uid::varchar = l.uid
            LEFT JOIN users lu ON l.assigned_to::varchar = lu.uid
            LEFT JOIN users cu ON p.created_by::varchar = cu.uid
            WHERE ${baseWhereClause}
            GROUP BY p.project_status_uid
        `;

        const offset = (page - 1) * limit;
        params.push(limit, offset);

        const dataQuery = `
            SELECT ${PROJECT_COLUMNS}, ${PROJECT_RELATIONS_COLUMNS} 
            FROM projects p
            LEFT JOIN (SELECT DISTINCT ON (module_uid) module_uid, note FROM notes WHERE module = 'project' AND is_deleted = 0 ORDER BY module_uid, created_at DESC) n ON n.module_uid = p.uid::varchar
            LEFT JOIN project_statuses ps ON p.project_status_uid = ps.uid 
            LEFT JOIN users u ON p.project_manager_uid::varchar = u.uid
            LEFT JOIN leads l ON p.lead_uid::varchar = l.uid
            LEFT JOIN users lu ON l.assigned_to::varchar = lu.uid
            LEFT JOIN users cu ON p.created_by::varchar = cu.uid
            LEFT JOIN quotations q ON p.quotation_uid::varchar = q.uid
            WHERE ${whereClause} 
            ORDER BY p.created_at DESC 
            LIMIT $${params.length - 1} OFFSET $${params.length}
        `;

        const [countsResult, result] = await Promise.all([
            this.pool.query(statusCountsQuery, baseParams),
            this.pool.query(dataQuery, params),
        ]);

        const statusCounts: Record<string, number> = {};
        let allCount = 0;
        for (const row of countsResult.rows) {
            const count = Number(row.cnt) || 0;
            if (row.statusUid) {
                statusCounts[String(row.statusUid)] = count;
            }
            allCount += count;
        }
        const total = filters?.projectStatusUid ? (statusCounts[filters.projectStatusUid] ?? 0) : allCount;

        return { rows: result.rows as IProject[], total, allCount, statusCounts };
    }

    async update(tenantUid: string, uid: string, data: IUpdateProject, updatedBy: string, client?: PoolClient): Promise<IProject | null> {
        const updates: string[] = [];
        const values: any[] = [];
        let index = 1;

        if (data.projectName !== undefined) { updates.push(`project_name = $${index++}`); values.push(data.projectName); }
        if (data.projectStatusUid !== undefined) { updates.push(`project_status_uid = $${index++}`); values.push(data.projectStatusUid); }
        if (data.projectManagerUid !== undefined) { updates.push(`project_manager_uid = $${index++}`); values.push(data.projectManagerUid || null); }
        if (data.projectDate !== undefined) { updates.push(`project_date = $${index++}`); values.push(data.projectDate || null); }

        if (updates.length === 0) return this.getByUid(tenantUid, uid, client);

        updates.push(`updated_by = $${index++}`);
        values.push(updatedBy);
        updates.push(`updated_at = CURRENT_TIMESTAMP`);

        values.push(uid, tenantUid);

        const executor = client || this.pool;
        const result = await executor.query(
            `UPDATE projects SET ${updates.join(", ")}
             WHERE uid::varchar = $${index} AND tenant_uid::varchar = $${index + 1} AND is_deleted = 0
             RETURNING uid`,
            values
        );
        return result.rows.length > 0 ? this.getByUid(tenantUid, uid, client) : null;
    }

    async softDelete(tenantUid: string, uid: string, deletedBy: string): Promise<boolean> {
        const result = await this.pool.query(
            `UPDATE projects 
             SET is_deleted = 1, deleted_by = $1, updated_at = CURRENT_TIMESTAMP, is_active = 0
             WHERE uid::varchar = $2 AND tenant_uid::varchar = $3 AND is_deleted = 0`,
            [deletedBy, uid, tenantUid]
        );
        return (result.rowCount ?? 0) > 0;
    }

    async restore(tenantUid: string, uid: string, updatedBy: string): Promise<boolean> {
        const result = await this.pool.query(
            `UPDATE projects 
             SET is_deleted = 0, deleted_by = NULL, updated_by = $1, updated_at = CURRENT_TIMESTAMP, is_active = 1
             WHERE uid::varchar = $2 AND tenant_uid::varchar = $3 AND is_deleted = 1`,
            [updatedBy, uid, tenantUid]
        );
        return (result.rowCount ?? 0) > 0;
    }
}

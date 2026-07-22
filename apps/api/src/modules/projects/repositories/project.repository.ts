import type { Pool, PoolClient } from "pg";
import type { IProject, ICreateProject, IUpdateProject } from "../interfaces/project.interface.js";
import { v4 as uuidv4 } from "uuid";

const PROJECT_COLUMNS = `
    p.id, p.uid, p.tenant_uid AS "tenantUid", p.lead_uid AS "leadUid", p.quotation_uid AS "quotationUid",
    p.project_number AS "projectNumber", p.project_name AS "projectName", p.project_status_uid AS "projectStatusUid",
    p.project_manager_uid AS "projectManagerUid", p.project_date AS "projectDate", p.remarks,
    p.is_active AS "isActive", p.is_deleted AS "isDeleted", 
    p.created_at AS "createdAt", p.updated_at AS "updatedAt",
    p.created_by AS "createdBy", p.updated_by AS "updatedBy", p.deleted_by AS "deletedBy"
`;

const PROJECT_RELATIONS_COLUMNS = `
    ps.name AS "statusName", ps.color AS "statusColor", ps.sort_order AS "statusSortOrder", ps.is_closed AS "statusIsClosed",
    TRIM(CONCAT(u.first_name, ' ', COALESCE(u.last_name, ''))) AS "projectManagerName",
    l.first_name AS "customerFirstName", l.last_name AS "customerLastName", l.mobile_number AS "customerMobileNumber"
`;

export class ProjectRepository {
    private readonly pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
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
                project_status_uid, project_manager_uid, project_date, remarks, created_by
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
            )
            RETURNING uid
        `;
        const values = [
            uid, tenantUid, data.leadUid, data.quotationUid, data.projectNumber, data.projectName, 
            data.statusUid, data.projectManagerUid || null, data.projectDate || null, data.remarks || null, createdBy
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
             LEFT JOIN project_statuses ps ON p.project_status_uid = ps.uid 
             LEFT JOIN users u ON p.project_manager_uid::varchar = u.uid
             LEFT JOIN leads l ON p.lead_uid::varchar = l.uid
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
    ): Promise<{ rows: IProject[]; total: number }> {
        const params: any[] = [tenantUid];
        let whereClause = "p.tenant_uid::varchar = $1";

        if (status === "active") whereClause += " AND p.is_deleted = 0";
        else if (status === "deleted") whereClause += " AND p.is_deleted = 1";

        if (filters?.projectStatusUid) {
            params.push(filters.projectStatusUid);
            whereClause += ` AND p.project_status_uid::varchar = $${params.length}`;
        }
        
        if (filters?.projectManagerUid) {
            params.push(filters.projectManagerUid);
            whereClause += ` AND p.project_manager_uid::varchar = $${params.length}`;
        }

        if (filters?.startDate) {
            params.push(filters.startDate);
            whereClause += ` AND p.project_date >= $${params.length}`;
        }

        if (filters?.endDate) {
            params.push(filters.endDate);
            whereClause += ` AND p.project_date <= $${params.length}`;
        }

        if (search) {
            params.push(`%${search}%`);
            const searchIndex = params.length;
            whereClause += ` AND (
                p.project_number ILIKE $${searchIndex} OR
                p.project_name ILIKE $${searchIndex} OR 
                l.first_name ILIKE $${searchIndex} OR
                l.last_name ILIKE $${searchIndex} OR
                l.mobile_number ILIKE $${searchIndex} OR
                u.first_name ILIKE $${searchIndex}
            )`;
        }

        const countQuery = `
            SELECT COUNT(*) FROM projects p
            LEFT JOIN users u ON p.project_manager_uid::varchar = u.uid
            LEFT JOIN leads l ON p.lead_uid::varchar = l.uid
            WHERE ${whereClause}
        `;

        const countResult = await this.pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count, 10);

        const offset = (page - 1) * limit;
        params.push(limit, offset);

        const dataQuery = `
            SELECT ${PROJECT_COLUMNS}, ${PROJECT_RELATIONS_COLUMNS} 
            FROM projects p
            LEFT JOIN project_statuses ps ON p.project_status_uid = ps.uid 
            LEFT JOIN users u ON p.project_manager_uid::varchar = u.uid
            LEFT JOIN leads l ON p.lead_uid::varchar = l.uid
            WHERE ${whereClause} 
            ORDER BY p.created_at DESC 
            LIMIT $${params.length - 1} OFFSET $${params.length}
        `;

        const result = await this.pool.query(dataQuery, params);

        return { rows: result.rows as IProject[], total };
    }

    async update(tenantUid: string, uid: string, data: IUpdateProject, updatedBy: string): Promise<IProject | null> {
        const updates: string[] = [];
        const values: any[] = [];
        let index = 1;

        if (data.projectName !== undefined) { updates.push(`project_name = $${index++}`); values.push(data.projectName); }
        if (data.projectStatusUid !== undefined) { updates.push(`project_status_uid = $${index++}`); values.push(data.projectStatusUid); }
        if (data.projectManagerUid !== undefined) { updates.push(`project_manager_uid = $${index++}`); values.push(data.projectManagerUid || null); }
        if (data.projectDate !== undefined) { updates.push(`project_date = $${index++}`); values.push(data.projectDate || null); }
        if (data.remarks !== undefined) { updates.push(`remarks = $${index++}`); values.push(data.remarks || null); }

        if (updates.length === 0) return this.getByUid(tenantUid, uid);

        updates.push(`updated_by = $${index++}`);
        values.push(updatedBy);
        updates.push(`updated_at = CURRENT_TIMESTAMP`);

        values.push(uid, tenantUid);

        const result = await this.pool.query(
            `UPDATE projects SET ${updates.join(", ")}
             WHERE uid::varchar = $${index} AND tenant_uid::varchar = $${index + 1} AND is_deleted = 0
             RETURNING uid`,
            values
        );
        return result.rows.length > 0 ? this.getByUid(tenantUid, uid) : null;
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

import type { Pool, PoolClient } from "pg";
import type { ISiteSurvey, ICreateSiteSurvey, IUpdateSiteSurvey } from "../interfaces/site-survey.interface.js";
import { v4 as uuidv4 } from "uuid";

const SITE_SURVEY_COLUMNS = `
    ss.id, ss.uid, ss.tenant_uid AS "tenantUid", ss.lead_uid AS "leadUid", 
    ss.assigned_to AS "assignedTo", ss.scheduled_at AS "scheduledAt", 
    ss.status, ss.remarks, ss.is_active AS "isActive", ss.is_deleted AS "isDeleted", 
    ss.created_at AS "createdAt", ss.updated_at AS "updatedAt",
    ss.created_by AS "createdBy", ss.updated_by AS "updatedBy", ss.deleted_by AS "deletedBy"
`;

export class SiteSurveyRepository {
    private readonly pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    async create(
        tenantUid: string,
        data: ICreateSiteSurvey,
        createdBy: string,
        client?: PoolClient
    ): Promise<ISiteSurvey> {
        const uid = uuidv4();
        const query = `
            INSERT INTO site_surveys (
                uid, tenant_uid, lead_uid, assigned_to, scheduled_at, remarks, created_by
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7
            )
            RETURNING id, uid, tenant_uid AS "tenantUid", lead_uid AS "leadUid", assigned_to AS "assignedTo", scheduled_at AS "scheduledAt", status, remarks, is_active AS "isActive", is_deleted AS "isDeleted", created_at AS "createdAt", updated_at AS "updatedAt", created_by AS "createdBy", updated_by AS "updatedBy", deleted_by AS "deletedBy"
        `;
        const values = [
            uid, tenantUid, data.leadUid, data.assignedTo, data.scheduledAt, data.remarks ?? null, createdBy
        ];

        const result = client 
            ? await client.query(query, values) 
            : await this.pool.query(query, values);
            
        return result.rows[0] as ISiteSurvey;
    }

    async getByUid(tenantUid: string, uid: string): Promise<ISiteSurvey | null> {
        const query = `
            SELECT ${SITE_SURVEY_COLUMNS},
                   TRIM(CONCAT(l.first_name, ' ', COALESCE(l.last_name, ''))) AS "leadName",
                   TRIM(CONCAT(u.first_name, ' ', COALESCE(u.last_name, ''))) AS "assignedUserName"
            FROM site_surveys ss
            LEFT JOIN leads l ON ss.lead_uid = l.uid
            LEFT JOIN users u ON ss.assigned_to = u.uid
            WHERE ss.uid = $1 AND ss.tenant_uid = $2 AND ss.is_deleted = 0
        `;
        const result = await this.pool.query(query, [uid, tenantUid]);
        return result.rows.length > 0 ? (result.rows[0] as ISiteSurvey) : null;
    }

    async getPaginated(
        tenantUid: string,
        page: number,
        limit: number,
        search?: string,
        surveyStatus?: number,
        status: "active" | "deleted" | "all" = "active",
        scheduledDate?: string,
        fromDate?: string,
        toDate?: string,
        assignedTo?: string,
        leadUid?: string
    ): Promise<{ rows: ISiteSurvey[]; total: number }> {
        const params: any[] = [tenantUid];
        let whereClause = "ss.tenant_uid = $1";

        if (status === "active") whereClause += " AND ss.is_deleted = 0";
        else if (status === "deleted") whereClause += " AND ss.is_deleted = 1";

        if (surveyStatus !== undefined) {
            params.push(surveyStatus);
            whereClause += ` AND ss.status = $${params.length}`;
        }

        if (assignedTo) {
            params.push(assignedTo);
            whereClause += ` AND ss.assigned_to = $${params.length}`;
        }

        if (leadUid) {
            params.push(leadUid);
            whereClause += ` AND ss.lead_uid = $${params.length}`;
        }
        
        if (scheduledDate) {
            params.push(scheduledDate);
            whereClause += ` AND DATE(ss.scheduled_at) = $${params.length}`;
        }
        
        if (fromDate) {
            params.push(fromDate);
            whereClause += ` AND ss.scheduled_at >= $${params.length}`;
        }
        
        if (toDate) {
            params.push(toDate);
            whereClause += ` AND ss.scheduled_at <= $${params.length}`;
        }

        if (search) {
            params.push(`%${search}%`);
            const searchIndex = params.length;
            whereClause += ` AND (
                l.first_name ILIKE $${searchIndex} OR 
                l.last_name ILIKE $${searchIndex} OR
                u.first_name ILIKE $${searchIndex} OR
                u.last_name ILIKE $${searchIndex}
            )`;
        }

        const countQuery = `
            SELECT COUNT(*) 
            FROM site_surveys ss
            LEFT JOIN leads l ON ss.lead_uid = l.uid
            LEFT JOIN users u ON ss.assigned_to = u.uid
            WHERE ${whereClause}
        `;
        
        const countResult = await this.pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count, 10);

        const offset = (page - 1) * limit;
        params.push(limit, offset);

        const dataQuery = `
            SELECT ${SITE_SURVEY_COLUMNS},
                   TRIM(CONCAT(l.first_name, ' ', COALESCE(l.last_name, ''))) AS "leadName",
                   TRIM(CONCAT(u.first_name, ' ', COALESCE(u.last_name, ''))) AS "assignedUserName"
            FROM site_surveys ss
            LEFT JOIN leads l ON ss.lead_uid = l.uid
            LEFT JOIN users u ON ss.assigned_to = u.uid
            WHERE ${whereClause}
            ORDER BY ss.created_at DESC
            LIMIT $${params.length - 1} OFFSET $${params.length}
        `;

        const dataResult = await this.pool.query(dataQuery, params);
        return { rows: dataResult.rows, total };
    }

    async update(
        tenantUid: string,
        uid: string,
        data: IUpdateSiteSurvey,
        updatedBy: string,
        client?: PoolClient
    ): Promise<ISiteSurvey> {
        const setFields: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (data.assignedTo !== undefined) {
            setFields.push(`assigned_to = $${paramIndex++}`);
            values.push(data.assignedTo);
        }
        if (data.scheduledAt !== undefined) {
            setFields.push(`scheduled_at = $${paramIndex++}`);
            values.push(data.scheduledAt);
        }
        if (data.status !== undefined) {
            setFields.push(`status = $${paramIndex++}`);
            values.push(data.status);
        }
        if (data.remarks !== undefined) {
            setFields.push(`remarks = $${paramIndex++}`);
            values.push(data.remarks);
        }

        setFields.push(`updated_at = CURRENT_TIMESTAMP`);
        setFields.push(`updated_by = $${paramIndex++}`);
        values.push(updatedBy);

        values.push(uid, tenantUid);

        const query = `
            UPDATE site_surveys
            SET ${setFields.join(", ")}
            WHERE uid = $${paramIndex - 2} AND tenant_uid = $${paramIndex - 1} AND is_deleted = 0
            RETURNING id, uid, tenant_uid AS "tenantUid", lead_uid AS "leadUid", assigned_to AS "assignedTo", scheduled_at AS "scheduledAt", status, remarks, is_active AS "isActive", is_deleted AS "isDeleted", created_at AS "createdAt", updated_at AS "updatedAt", created_by AS "createdBy", updated_by AS "updatedBy", deleted_by AS "deletedBy"
        `;

        const result = client
            ? await client.query(query, values)
            : await this.pool.query(query, values);

        return result.rows[0] as ISiteSurvey;
    }

    async softDelete(tenantUid: string, uid: string, deletedBy: string): Promise<boolean> {
        const query = `
            UPDATE site_surveys
            SET is_deleted = 1, deleted_by = $1, updated_at = CURRENT_TIMESTAMP
            WHERE uid = $2 AND tenant_uid = $3 AND is_deleted = 0
        `;
        const result = await this.pool.query(query, [deletedBy, uid, tenantUid]);
        return (result.rowCount ?? 0) > 0;
    }

    async restore(tenantUid: string, uid: string, updatedBy: string): Promise<boolean> {
        const query = `
            UPDATE site_surveys
            SET is_deleted = 0, updated_by = $1, updated_at = CURRENT_TIMESTAMP
            WHERE uid = $2 AND tenant_uid = $3 AND is_deleted = 1
        `;
        const result = await this.pool.query(query, [updatedBy, uid, tenantUid]);
        return (result.rowCount ?? 0) > 0;
    }

    async getAll(tenantUid: string, status: "active" | "deleted" | "all" = "active"): Promise<ISiteSurvey[]> {
        let whereClause = "ss.tenant_uid = $1";
        const params: any[] = [tenantUid];

        if (status === "active") whereClause += " AND ss.is_deleted = 0";
        else if (status === "deleted") whereClause += " AND ss.is_deleted = 1";

        const query = `
            SELECT ${SITE_SURVEY_COLUMNS},
                   TRIM(CONCAT(l.first_name, ' ', COALESCE(l.last_name, ''))) AS "leadName",
                   TRIM(CONCAT(u.first_name, ' ', COALESCE(u.last_name, ''))) AS "assignedUserName"
            FROM site_surveys ss
            LEFT JOIN leads l ON ss.lead_uid = l.uid
            LEFT JOIN users u ON ss.assigned_to = u.uid
            WHERE ${whereClause}
            ORDER BY ss.created_at DESC
        `;
        const result = await this.pool.query(query, params);
        return result.rows;
    }
}

import type { Pool, PoolClient } from "pg";
import type { IFollowUp, ICreateFollowUp } from "../interfaces/follow-up.interface.js";
import { CustomError } from "../../../middlewares/error.middleware.js";
import { v4 as uuidv4 } from "uuid";

const FOLLOW_UP_COLUMNS = `
    fu.id, fu.uid, fu.tenant_uid AS "tenantUid", fu.lead_uid AS "leadUid",
    fu.follow_up_date AS "followUpDate", fu.status, fu.notes, fu.assigned_to AS "assignedTo",
    fu.is_active AS "isActive", fu.is_deleted AS "isDeleted",
    fu.created_at AS "createdAt", fu.updated_at AS "updatedAt",
    fu.created_by AS "createdBy", fu.updated_by AS "updatedBy",
    COALESCE(NULLIF(TRIM(CONCAT(u.first_name, ' ', COALESCE(u.last_name, ''))), ''), u.email) AS "assignedToName",
    u.email AS "assignedToEmail",
    COALESCE(NULLIF(TRIM(CONCAT(cu.first_name, ' ', COALESCE(cu.last_name, ''))), ''), CASE WHEN fu.created_by = 'SYSTEM' THEN 'System' ELSE NULL END, cu.email) AS "createdByName",
    cu.email AS "createdByEmail"
`;

export class FollowUpRepository {
    private readonly pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    async create(
        tenantUid: string,
        data: ICreateFollowUp,
        createdBy?: string,
        client?: PoolClient
    ): Promise<IFollowUp> {
        const ownsClient = !client;
        const executor = client || (await this.pool.connect());

        try {
            if (ownsClient) {
                await executor.query("BEGIN");
            }

            // 0. Row-level lock on the lead to prevent concurrent duplicate follow-up creation
            await executor.query(
                `SELECT id FROM leads WHERE uid = $1 AND tenant_uid = $2 FOR UPDATE`,
                [data.leadUid, tenantUid]
            );

            // 1. Check if a follow-up is already active or recently scheduled for this lead at the exact same minute
            const conflictCheck = await executor.query(
                `
                SELECT id
                FROM follow_ups
                WHERE tenant_uid = $1 
                  AND lead_uid = $2 
                  AND is_deleted = 0
                  AND (
                    (is_active = 1 AND date_trunc('minute', follow_up_date AT TIME ZONE 'UTC') = date_trunc('minute', $3::timestamptz AT TIME ZONE 'UTC'))
                    OR
                    (created_at >= NOW() - INTERVAL '5 seconds' AND date_trunc('minute', follow_up_date AT TIME ZONE 'UTC') = date_trunc('minute', $3::timestamptz AT TIME ZONE 'UTC'))
                  )
                LIMIT 1
                `,
                [tenantUid, data.leadUid, data.followUpDate]
            );

            if (conflictCheck.rows.length > 0) {
                throw new CustomError(
                    "A follow-up is already scheduled for this exact date and time. Same date is acceptable, but please choose a different time.",
                    400
                );
            }

            // 2. Deactivate any existing active follow-up for this lead
            await executor.query(
                `
                UPDATE follow_ups
                SET 
                    is_active = 0,
                    status = CASE WHEN status = 'scheduled' THEN 'rescheduled' ELSE status END,
                    updated_at = CURRENT_TIMESTAMP,
                    updated_by = $1
                WHERE tenant_uid = $2 AND lead_uid = $3 AND is_active = 1 AND is_deleted = 0
                `,
                [createdBy || null, tenantUid, data.leadUid]
            );

            // 3. Insert new active follow-up
            const uid = uuidv4();
            const insertQuery = `
                WITH inserted AS (
                    INSERT INTO follow_ups (
                        uid, tenant_uid, lead_uid, follow_up_date, status, notes, assigned_to, is_active, created_by
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, 1, $8)
                    RETURNING *
                )
                SELECT 
                    fu.id, fu.uid, fu.tenant_uid AS "tenantUid", fu.lead_uid AS "leadUid",
                    fu.follow_up_date AS "followUpDate", fu.status, fu.notes, fu.assigned_to AS "assignedTo",
                    fu.is_active AS "isActive", fu.is_deleted AS "isDeleted",
                    fu.created_at AS "createdAt", fu.updated_at AS "updatedAt",
                    fu.created_by AS "createdBy", fu.updated_by AS "updatedBy",
                    COALESCE(NULLIF(TRIM(CONCAT(u.first_name, ' ', COALESCE(u.last_name, ''))), ''), u.email) AS "assignedToName",
                    u.email AS "assignedToEmail",
                    COALESCE(NULLIF(TRIM(CONCAT(cu.first_name, ' ', COALESCE(cu.last_name, ''))), ''), CASE WHEN fu.created_by = 'SYSTEM' THEN 'System' ELSE NULL END, cu.email) AS "createdByName",
                    cu.email AS "createdByEmail"
                FROM inserted fu
                LEFT JOIN users u ON fu.assigned_to = u.uid
                LEFT JOIN users cu ON fu.created_by = cu.uid
            `;

            const values = [
                uid,
                tenantUid,
                data.leadUid,
                data.followUpDate,
                data.status || "scheduled",
                data.notes || null,
                data.assignedTo || null,
                createdBy || null,
            ];

            const result = await executor.query(insertQuery, values);

            if (ownsClient) {
                await executor.query("COMMIT");
            }

            return result.rows[0] as IFollowUp;
        } catch (error) {
            if (ownsClient) {
                await executor.query("ROLLBACK");
            }
            throw error;
        } finally {
            if (ownsClient) {
                (executor as PoolClient).release();
            }
        }
    }

    async getHistoryByLeadUid(
        tenantUid: string,
        leadUid: string,
        client?: PoolClient
    ): Promise<IFollowUp[]> {
        const executor = client || this.pool;
        const query = `
            SELECT ${FOLLOW_UP_COLUMNS}
            FROM follow_ups fu
            LEFT JOIN users u ON fu.assigned_to = u.uid
            LEFT JOIN users cu ON fu.created_by = cu.uid
            WHERE fu.tenant_uid = $1 
              AND (
                fu.lead_uid = $2 
                OR fu.lead_uid = (
                    SELECT l.uid 
                    FROM leads l 
                    WHERE (l.uid = $2 OR l.id::varchar = $2 OR l.lead_number = $2) 
                      AND l.tenant_uid = $1 
                    LIMIT 1
                )
              ) 
              AND fu.is_deleted = 0
            ORDER BY fu.created_at DESC, fu.id DESC
        `;
        const result = await executor.query(query, [tenantUid, leadUid]);
        return result.rows as IFollowUp[];
    }

    async getActiveByLeadUid(
        tenantUid: string,
        leadUid: string,
        client?: PoolClient
    ): Promise<IFollowUp | null> {
        const executor = client || this.pool;
        const query = `
            SELECT ${FOLLOW_UP_COLUMNS}
            FROM follow_ups fu
            LEFT JOIN users u ON fu.assigned_to = u.uid
            LEFT JOIN users cu ON fu.created_by = cu.uid
            WHERE fu.tenant_uid = $1 AND fu.lead_uid = $2 AND fu.is_active = 1 AND fu.is_deleted = 0
            LIMIT 1
        `;
        const result = await executor.query(query, [tenantUid, leadUid]);
        return result.rows.length > 0 ? (result.rows[0] as IFollowUp) : null;
    }

    async completeFollowUp(
        tenantUid: string,
        leadUid: string,
        notes?: string,
        updatedBy?: string,
        client?: PoolClient
    ): Promise<IFollowUp | null> {
        const executor = client || this.pool;
        const query = `
            WITH updated AS (
                UPDATE follow_ups
                SET 
                    is_active = 0,
                    status = 'completed',
                    notes = COALESCE($1, notes),
                    updated_at = CURRENT_TIMESTAMP,
                    updated_by = $2
                WHERE tenant_uid = $3 AND lead_uid = $4 AND is_active = 1 AND is_deleted = 0
                RETURNING *
            )
            SELECT 
                fu.id, fu.uid, fu.tenant_uid AS "tenantUid", fu.lead_uid AS "leadUid",
                fu.follow_up_date AS "followUpDate", fu.status, fu.notes, fu.assigned_to AS "assignedTo",
                fu.is_active AS "isActive", fu.is_deleted AS "isDeleted",
                fu.created_at AS "createdAt", fu.updated_at AS "updatedAt",
                fu.created_by AS "createdBy", fu.updated_by AS "updatedBy",
                COALESCE(NULLIF(TRIM(CONCAT(u.first_name, ' ', COALESCE(u.last_name, ''))), ''), u.email) AS "assignedToName",
                u.email AS "assignedToEmail",
                COALESCE(NULLIF(TRIM(CONCAT(cu.first_name, ' ', COALESCE(cu.last_name, ''))), ''), cu.email) AS "createdByName",
                cu.email AS "createdByEmail"
            FROM updated fu
            LEFT JOIN users u ON fu.assigned_to = u.uid
            LEFT JOIN users cu ON fu.created_by = cu.uid
        `;
        const result = await executor.query(query, [notes || null, updatedBy || null, tenantUid, leadUid]);
        return result.rows.length > 0 ? (result.rows[0] as IFollowUp) : null;
    }

    async cancelFollowUp(
        tenantUid: string,
        leadUid: string,
        notes?: string,
        updatedBy?: string,
        client?: PoolClient
    ): Promise<IFollowUp | null> {
        const executor = client || this.pool;
        const query = `
            WITH updated AS (
                UPDATE follow_ups
                SET 
                    is_active = 0,
                    status = 'cancelled',
                    notes = COALESCE($1, notes),
                    updated_at = CURRENT_TIMESTAMP,
                    updated_by = $2
                WHERE tenant_uid = $3 AND lead_uid = $4 AND is_active = 1 AND is_deleted = 0
                RETURNING *
            )
            SELECT 
                fu.id, fu.uid, fu.tenant_uid AS "tenantUid", fu.lead_uid AS "leadUid",
                fu.follow_up_date AS "followUpDate", fu.status, fu.notes, fu.assigned_to AS "assignedTo",
                fu.is_active AS "isActive", fu.is_deleted AS "isDeleted",
                fu.created_at AS "createdAt", fu.updated_at AS "updatedAt",
                fu.created_by AS "createdBy", fu.updated_by AS "updatedBy",
                COALESCE(NULLIF(TRIM(CONCAT(u.first_name, ' ', COALESCE(u.last_name, ''))), ''), u.email) AS "assignedToName",
                u.email AS "assignedToEmail",
                COALESCE(NULLIF(TRIM(CONCAT(cu.first_name, ' ', COALESCE(cu.last_name, ''))), ''), cu.email) AS "createdByName",
                cu.email AS "createdByEmail"
            FROM updated fu
            LEFT JOIN users u ON fu.assigned_to = u.uid
            LEFT JOIN users cu ON fu.created_by = cu.uid
        `;
        const result = await executor.query(query, [notes || null, updatedBy || null, tenantUid, leadUid]);
        return result.rows.length > 0 ? (result.rows[0] as IFollowUp) : null;
    }

    async getActiveFollowUps(
        tenantUid: string,
        assignedTo?: string,
        client?: PoolClient
    ): Promise<any[]> {
        const executor = client || this.pool;
        let query = `
            SELECT 
                fu.id AS "followUpId",
                fu.uid AS "followUpUid",
                fu.tenant_uid AS "tenantUid",
                fu.lead_uid AS "leadUid",
                fu.lead_uid AS "uid",
                fu.follow_up_date AS "followUpDate",
                fu.status AS "followUpStatus",
                fu.notes AS "remarks",
                COALESCE(fu.assigned_to, l.assigned_to) AS "assignedTo",
                l.assigned_to AS "leadAssignedTo",
                fu.is_active AS "isActive",
                fu.created_at AS "createdAt",
                fu.updated_at AS "updatedAt",
                fu.created_by AS "createdBy",
                COALESCE(NULLIF(TRIM(CONCAT(u.first_name, ' ', COALESCE(u.last_name, ''))), ''), u.email) AS "assignedToName",
                u.email AS "assignedToEmail",
                COALESCE(NULLIF(TRIM(CONCAT(cu.first_name, ' ', COALESCE(cu.last_name, ''))), ''), CASE WHEN fu.created_by = 'SYSTEM' THEN 'System' ELSE NULL END, cu.email) AS "createdByName",
                l.first_name AS "firstName",
                l.last_name AS "lastName",
                l.mobile_number AS "mobileNumber",
                l.alternate_number AS "alternateNumber",
                l.email,
                l.address,
                l.landmark,
                l.locality,
                l.state,
                l.city,
                l.pin_code AS "pinCode",
                l.monthly_bill_amount AS "monthlyBillAmount",
                l.system_size AS "systemSize",
                l.lead_number AS "leadNumber",
                l.status_uid AS "statusUid",
                l.status_uid AS "leadStatusUid",
                l.lead_source_uid AS "leadSourceUid",
                l.category,
                1 AS "isFollowUp",
                0 AS "isDraft",
                ls.name AS "statusName",
                ls.name AS "leadStatusName",
                ls.color AS "statusColor",
                ls.color AS "leadStatusColor",
                lsrc.name AS "sourceName",
                lsrc.name AS "leadSourceName",
                lsrc.color AS "sourceColor",
                lsrc.color AS "leadSourceColor",
                (
                    SELECT q.system_size 
                    FROM quotations q 
                    WHERE q.lead_uid::varchar = l.uid AND q.is_deleted = 0 
                    ORDER BY q.created_at DESC 
                    LIMIT 1
                ) AS "finalSystemSize"
            FROM follow_ups fu
            JOIN leads l ON fu.lead_uid = l.uid AND l.is_deleted = 0
            LEFT JOIN lead_statuses ls ON l.status_uid = ls.uid
            LEFT JOIN lead_sources lsrc ON l.lead_source_uid = lsrc.uid
            LEFT JOIN users u ON COALESCE(fu.assigned_to, l.assigned_to) = u.uid
            LEFT JOIN users cu ON fu.created_by = cu.uid
            WHERE fu.tenant_uid = $1 AND fu.is_active = 1 AND fu.status = 'scheduled' AND fu.is_deleted = 0
        `;
        const params: any[] = [tenantUid];
        if (assignedTo) {
            params.push(assignedTo);
            query += ` AND (fu.assigned_to = $2 OR (fu.assigned_to IS NULL AND l.assigned_to = $2) OR l.assigned_to = $2)`;
        }
        query += ` ORDER BY fu.follow_up_date ASC, fu.id DESC`;

        const result = await executor.query(query, params);
        return result.rows;
    }

    async findConflict(
        tenantUid: string,
        followUpDate: Date | string,
        excludeLeadUid?: string | null,
        assignedTo?: string | null,
        client?: PoolClient
    ): Promise<{
        uid: string;
        leadNumber: string;
        customerName: string;
        followUpDate: Date | string;
        assignedTo?: string | null;
        assignedToName?: string | null;
    } | null> {
        if (!assignedTo || !assignedTo.trim()) {
            return null;
        }

        const executor = client || this.pool;
        const query = `
            SELECT 
                l.uid,
                l.lead_number AS "leadNumber",
                TRIM(CONCAT(l.first_name, ' ', COALESCE(l.last_name, ''))) AS "customerName",
                COALESCE(fu.follow_up_date, l.follow_up_date) AS "followUpDate",
                COALESCE(fu.assigned_to, l.assigned_to) AS "assignedTo",
                COALESCE(NULLIF(TRIM(CONCAT(u.first_name, ' ', COALESCE(u.last_name, ''))), ''), u.email) AS "assignedToName"
            FROM leads l
            LEFT JOIN follow_ups fu 
                ON fu.lead_uid = l.uid 
                AND fu.is_active = 1 
                AND fu.is_deleted = 0 
                AND fu.status = 'scheduled'
            LEFT JOIN users u 
                ON COALESCE(fu.assigned_to, l.assigned_to) = u.uid
            WHERE l.tenant_uid = $1
              AND l.is_deleted = 0
              AND (
                (l.is_follow_up = 1 AND l.follow_up_date IS NOT NULL AND date_trunc('minute', l.follow_up_date AT TIME ZONE 'UTC') = date_trunc('minute', $2::timestamptz AT TIME ZONE 'UTC'))
                OR
                (fu.id IS NOT NULL AND date_trunc('minute', fu.follow_up_date AT TIME ZONE 'UTC') = date_trunc('minute', $2::timestamptz AT TIME ZONE 'UTC'))
              )
              AND ($3::varchar IS NULL OR l.uid != $3)
              AND COALESCE(fu.assigned_to, l.assigned_to)::varchar = $4::varchar
            LIMIT 1
        `;
        const result = await executor.query(query, [tenantUid, followUpDate, excludeLeadUid || null, assignedTo.trim()]);
        return result.rows.length > 0 ? (result.rows[0] as any) : null;
    }
}


import type { Pool, PoolClient } from "pg";
import type { ILead, ICreateLead, IUpdateLead } from "../interfaces/lead.interface.js";
import { v4 as uuidv4 } from "uuid";

const LEAD_COLUMNS = `
    id, uid, tenant_uid AS "tenantUid", lead_number AS "leadNumber",
    first_name AS "firstName", last_name AS "lastName", 
    mobile_number AS "mobileNumber", alternate_number AS "alternateNumber", 
    email, address, state, city, pin_code AS "pinCode",
    monthly_bill_amount AS "monthlyBillAmount", system_size AS "systemSize", 
    follow_up_date AS "followUpDate", lead_source_uid AS "leadSourceUid", 
    status_uid AS "statusUid", assigned_to AS "assignedTo", remarks,
    is_active AS "isActive", is_deleted AS "isDeleted", 
    created_at AS "createdAt", updated_at AS "updatedAt",
    created_by AS "createdBy", updated_by AS "updatedBy", deleted_by AS "deletedBy"
`;

const LEAD_JOIN_COLUMNS = `
    l.id, l.uid, l.tenant_uid AS "tenantUid", l.lead_number AS "leadNumber",
    l.first_name AS "firstName", l.last_name AS "lastName", 
    l.mobile_number AS "mobileNumber", l.alternate_number AS "alternateNumber", 
    l.email, l.address, l.state, l.city, l.pin_code AS "pinCode",
    l.monthly_bill_amount AS "monthlyBillAmount", l.system_size AS "systemSize", 
    l.follow_up_date AS "followUpDate", l.lead_source_uid AS "leadSourceUid", 
    l.status_uid AS "statusUid", l.assigned_to AS "assignedTo", l.remarks,
    l.is_active AS "isActive", l.is_deleted AS "isDeleted", 
    l.created_at AS "createdAt", l.updated_at AS "updatedAt",
    l.created_by AS "createdBy", l.updated_by AS "updatedBy", l.deleted_by AS "deletedBy"
`;

const LEAD_RELATIONS_COLUMNS = `
    ls.name AS "statusName", ls.color AS "statusColor", ls.sort_order AS "statusSortOrder", 
    ls.is_default AS "statusIsDefault", ls.is_closed AS "statusIsClosed", 
    ls.is_active AS "statusIsActive", ls.is_deleted AS "statusIsDeleted",
    lsrc.name AS "sourceName", lsrc.color AS "sourceColor", lsrc.sort_order AS "sourceSortOrder", 
    lsrc.is_default AS "sourceIsDefault", lsrc.is_active AS "sourceIsActive", lsrc.is_deleted AS "sourceIsDeleted",
    TRIM(CONCAT(u.first_name, ' ', COALESCE(u.last_name, ''))) AS "assignedUserName"
`;

export class LeadRepository {
    private readonly pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    async create(
        tenantUid: string,
        data: ICreateLead,
        createdBy: string,
        client?: PoolClient
    ): Promise<ILead> {
        const uid = uuidv4();
        const query = `
            INSERT INTO leads (
                uid, tenant_uid, lead_number, first_name, last_name, mobile_number, alternate_number, email, 
                address, state, city, pin_code, monthly_bill_amount, system_size, follow_up_date, 
                lead_source_uid, status_uid, assigned_to, remarks, created_by
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
            )
            RETURNING ${LEAD_COLUMNS}
        `;
        const values = [
            uid, tenantUid, data.leadNumber, data.firstName, data.lastName ?? null, data.mobileNumber, 
            data.alternateNumber ?? null, data.email ?? null, data.address ?? null, 
            data.state, data.city, data.pinCode ?? null, data.monthlyBillAmount ?? null, 
            data.systemSize, data.followUpDate || null, data.leadSourceUid ?? null, 
            data.statusUid, data.assignedTo ?? null, data.remarks ?? null, createdBy
        ];

        const result = client 
            ? await client.query(query, values) 
            : await this.pool.query(query, values);
            
        const created = result.rows[0] as ILead;
        if (!created) return created;
        return await this.getByUid(tenantUid, created.uid, client) as ILead;
    }

    async getLastLeadNumber(client?: PoolClient): Promise<string | null> {
        const query = `
            SELECT lead_number 
            FROM leads 
            WHERE lead_number LIKE 'SS%' 
            ORDER BY id DESC 
            LIMIT 1
        `;
        const result = client 
            ? await client.query(query) 
            : await this.pool.query(query);
        return result.rows.length > 0 ? result.rows[0].lead_number : null;
    }

    async getByUid(tenantUid: string, uid: string, client?: PoolClient): Promise<ILead | null> {
        const query = `
             SELECT ${LEAD_JOIN_COLUMNS}, ${LEAD_RELATIONS_COLUMNS}
             FROM leads l
             LEFT JOIN lead_statuses ls ON l.status_uid = ls.uid 
             LEFT JOIN lead_sources lsrc ON l.lead_source_uid = lsrc.uid
             LEFT JOIN users u ON l.assigned_to = u.uid
             WHERE l.uid = $1 AND l.tenant_uid = $2 AND l.is_deleted = 0
        `;
        const result = client
            ? await client.query(query, [uid, tenantUid])
            : await this.pool.query(query, [uid, tenantUid]);
        return result.rows.length > 0 ? (result.rows[0] as ILead) : null;
    }

    async getPaginated(
        tenantUid: string,
        page: number,
        limit: number,
        search?: string,
        status: "active" | "deleted" | "all" = "active"
    ): Promise<{ rows: ILead[]; total: number }> {
        const params: any[] = [tenantUid];
        let whereClause = "tenant_uid = $1";

        if (status === "active") whereClause += " AND is_deleted = 0";
        else if (status === "deleted") whereClause += " AND is_deleted = 1";

        if (search) {
            params.push(`%${search}%`);
            const searchIndex = params.length;
            whereClause += ` AND (
                lead_number ILIKE $${searchIndex} OR
                first_name ILIKE $${searchIndex} OR 
                last_name ILIKE $${searchIndex} OR 
                mobile_number ILIKE $${searchIndex} OR 
                email ILIKE $${searchIndex}
            )`;
        }

        const countResult = await this.pool.query(
            `SELECT COUNT(*) FROM leads l WHERE ${whereClause.replace(/tenant_uid/g, 'l.tenant_uid').replace(/is_deleted/g, 'l.is_deleted').replace(/first_name/g, 'l.first_name').replace(/last_name/g, 'l.last_name').replace(/mobile_number/g, 'l.mobile_number').replace(/email/g, 'l.email')}`,
            params
        );
        const total = parseInt(countResult.rows[0].count, 10);

        const offset = (page - 1) * limit;
        params.push(limit, offset);

        const result = await this.pool.query(
            `SELECT ${LEAD_JOIN_COLUMNS}, ${LEAD_RELATIONS_COLUMNS} 
             FROM leads l
             LEFT JOIN lead_statuses ls ON l.status_uid = ls.uid 
             LEFT JOIN lead_sources lsrc ON l.lead_source_uid = lsrc.uid
             LEFT JOIN users u ON l.assigned_to = u.uid
             WHERE ${whereClause.replace(/tenant_uid/g, 'l.tenant_uid').replace(/is_deleted/g, 'l.is_deleted').replace(/first_name/g, 'l.first_name').replace(/last_name/g, 'l.last_name').replace(/mobile_number/g, 'l.mobile_number').replace(/email/g, 'l.email')} 
             ORDER BY l.created_at DESC 
             LIMIT $${params.length - 1} OFFSET $${params.length}`,
            params
        );

        return { rows: result.rows as ILead[], total };
    }

    async getAll(
        tenantUid: string,
        status: "active" | "deleted" | "all" = "active"
    ): Promise<ILead[]> {
        const params: any[] = [tenantUid];
        let whereClause = "l.tenant_uid = $1";

        if (status === "active") whereClause += " AND l.is_deleted = 0";
        else if (status === "deleted") whereClause += " AND l.is_deleted = 1";

        const result = await this.pool.query(
            `SELECT ${LEAD_JOIN_COLUMNS}, ${LEAD_RELATIONS_COLUMNS} 
             FROM leads l
             LEFT JOIN lead_statuses ls ON l.status_uid = ls.uid 
             LEFT JOIN lead_sources lsrc ON l.lead_source_uid = lsrc.uid
             LEFT JOIN users u ON l.assigned_to = u.uid
             WHERE ${whereClause} 
             ORDER BY l.created_at DESC`,
            params
        );

        return result.rows as ILead[];
    }

    async update(tenantUid: string, uid: string, data: IUpdateLead, updatedBy: string): Promise<ILead | null> {
        const updates: string[] = [];
        const values: any[] = [];
        let index = 1;

        if (data.firstName !== undefined) { updates.push(`first_name = $${index++}`); values.push(data.firstName); }
        if (data.lastName !== undefined) { updates.push(`last_name = $${index++}`); values.push(data.lastName); }
        if (data.mobileNumber !== undefined) { updates.push(`mobile_number = $${index++}`); values.push(data.mobileNumber); }
        if (data.alternateNumber !== undefined) { updates.push(`alternate_number = $${index++}`); values.push(data.alternateNumber); }
        if (data.email !== undefined) { updates.push(`email = $${index++}`); values.push(data.email); }
        if (data.address !== undefined) { updates.push(`address = $${index++}`); values.push(data.address); }
        if (data.state !== undefined) { updates.push(`state = $${index++}`); values.push(data.state); }
        if (data.city !== undefined) { updates.push(`city = $${index++}`); values.push(data.city); }
        if (data.pinCode !== undefined) { updates.push(`pin_code = $${index++}`); values.push(data.pinCode); }
        if (data.monthlyBillAmount !== undefined) { updates.push(`monthly_bill_amount = $${index++}`); values.push(data.monthlyBillAmount); }
        if (data.systemSize !== undefined) { updates.push(`system_size = $${index++}`); values.push(data.systemSize); }
        if (data.followUpDate !== undefined) { updates.push(`follow_up_date = $${index++}`); values.push(data.followUpDate || null); }
        if (data.leadSourceUid !== undefined) { updates.push(`lead_source_uid = $${index++}`); values.push(data.leadSourceUid); }
        if (data.statusUid !== undefined) { updates.push(`status_uid = $${index++}`); values.push(data.statusUid); }
        if (data.assignedTo !== undefined) { updates.push(`assigned_to = $${index++}`); values.push(data.assignedTo); }
        if (data.remarks !== undefined) { updates.push(`remarks = $${index++}`); values.push(data.remarks); }

        if (updates.length === 0) return this.getByUid(tenantUid, uid);

        updates.push(`updated_by = $${index++}`);
        values.push(updatedBy);
        updates.push(`updated_at = CURRENT_TIMESTAMP`);

        values.push(uid, tenantUid);

        const result = await this.pool.query(
            `UPDATE leads SET ${updates.join(", ")}
             WHERE uid = $${index - 2} AND tenant_uid = $${index - 1} AND is_deleted = 0
             RETURNING uid`,
            values
        );
        return result.rows.length > 0 ? this.getByUid(tenantUid, uid) : null;
    }

    async softDelete(tenantUid: string, uid: string, deletedBy: string): Promise<boolean> {
        const result = await this.pool.query(
            `UPDATE leads 
             SET is_deleted = 1, deleted_by = $1, updated_at = CURRENT_TIMESTAMP
             WHERE uid = $2 AND tenant_uid = $3 AND is_deleted = 0`,
            [deletedBy, uid, tenantUid]
        );
        return (result.rowCount ?? 0) > 0;
    }

    async restore(tenantUid: string, uid: string, updatedBy: string): Promise<boolean> {
        const result = await this.pool.query(
            `UPDATE leads 
             SET is_deleted = 0, deleted_by = NULL, updated_by = $1, updated_at = CURRENT_TIMESTAMP
             WHERE uid = $2 AND tenant_uid = $3 AND is_deleted = 1`,
            [updatedBy, uid, tenantUid]
        );
        return (result.rowCount ?? 0) > 0;
    }
}

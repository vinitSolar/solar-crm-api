import type { Pool, PoolClient } from "pg";
import type { ISubsidyTracker, ICreateSubsidyTracker, IUpdateSubsidyTracker, IPaginationQuery, IPaginatedResponse } from "../interfaces/subsidy-tracker.interface.js";
import { v4 as uuidv4 } from "uuid";

const SUBSIDY_TRACKER_COLUMNS = `
    st.id, st.uid, st.tenant_uid AS "tenantUid", st.project_uid AS "projectUid", st.lead_uid AS "leadUid",
    st.subsidy_uid AS "subsidyUid", st.name, st.portal_status AS "portalStatus", st.net_meter_status AS "netMeterStatus",
    st.portal_reference_number AS "portalReferenceNumber", st.discom_reference_number AS "discomReferenceNumber",
    st.expected_subsidy_amount AS "expectedSubsidyAmount", st.approved_subsidy_amount AS "approvedSubsidyAmount", st.received_subsidy_amount AS "receivedSubsidyAmount",
    st.approved_date AS "approvedDate", st.disbursed_date AS "disbursedDate", n.note AS "remarks",
    st.is_active AS "isActive", st.is_deleted AS "isDeleted",
    st.created_at AS "createdAt", st.updated_at AS "updatedAt",
    st.created_by AS "createdBy", st.updated_by AS "updatedBy", st.deleted_by AS "deletedBy"
`;

export class SubsidyTrackerRepository {
    private readonly pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    private mapToCamelCase(row: any): ISubsidyTracker {
        return row as ISubsidyTracker;
    }

    async create(tenantUid: string, data: ICreateSubsidyTracker, createdBy: string, client?: PoolClient): Promise<ISubsidyTracker> {
        const uid = uuidv4();
        const executor = client || this.pool;
        
        const query = `
            INSERT INTO subsidy_trackers (
                uid, tenant_uid, project_uid, lead_uid, subsidy_uid, name,
                portal_status, net_meter_status, expected_subsidy_amount, created_by, updated_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, 0, 0, $7, $8, $8)
            RETURNING uid
        `;
        
        const values = [
            uid,
            tenantUid,
            data.projectUid,
            data.leadUid,
            data.subsidyUid || null,
            data.name || null,
            data.expectedSubsidyAmount || null,
            createdBy
        ];

        await executor.query(query, values);
        return (await this.getByUid(tenantUid, uid)) as ISubsidyTracker;
    }

    async getByUid(tenantUid: string, uid: string): Promise<ISubsidyTracker | null> {
        const query = `
            SELECT ${SUBSIDY_TRACKER_COLUMNS} 
            FROM subsidy_trackers st
            LEFT JOIN (SELECT DISTINCT ON (module_uid) module_uid, note FROM notes WHERE module = 'subsidy_tracker' AND is_deleted = 0 ORDER BY module_uid, created_at DESC) n ON n.module_uid = st.uid
            WHERE st.tenant_uid = $1 AND st.uid = $2 AND st.is_deleted = 0`;
        const result = await this.pool.query(query, [tenantUid, uid]);
        return result.rows.length > 0 ? this.mapToCamelCase(result.rows[0]) : null;
    }

    async getByProjectUid(tenantUid: string, projectUid: string): Promise<ISubsidyTracker | null> {
        const query = `
            SELECT ${SUBSIDY_TRACKER_COLUMNS} 
            FROM subsidy_trackers st
            LEFT JOIN (SELECT DISTINCT ON (module_uid) module_uid, note FROM notes WHERE module = 'subsidy_tracker' AND is_deleted = 0 ORDER BY module_uid, created_at DESC) n ON n.module_uid = st.uid
            WHERE st.tenant_uid = $1 AND st.project_uid = $2 AND st.is_deleted = 0`;
        const result = await this.pool.query(query, [tenantUid, projectUid]);
        return result.rows.length > 0 ? this.mapToCamelCase(result.rows[0]) : null;
    }

    async update(tenantUid: string, uid: string, data: IUpdateSubsidyTracker, updatedBy: string, client?: PoolClient): Promise<ISubsidyTracker | null> {
        const executor = client || this.pool;
        const updates: string[] = [];
        const values: any[] = [];
        let index = 1;

        if (data.portalStatus !== undefined) { updates.push(`portal_status = $${index++}`); values.push(data.portalStatus); }
        if (data.netMeterStatus !== undefined) { updates.push(`net_meter_status = $${index++}`); values.push(data.netMeterStatus); }
        if (data.portalReferenceNumber !== undefined) { updates.push(`portal_reference_number = $${index++}`); values.push(data.portalReferenceNumber); }
        if (data.discomReferenceNumber !== undefined) { updates.push(`discom_reference_number = $${index++}`); values.push(data.discomReferenceNumber); }
        if (data.approvedSubsidyAmount !== undefined) { updates.push(`approved_subsidy_amount = $${index++}`); values.push(data.approvedSubsidyAmount); }
        if (data.receivedSubsidyAmount !== undefined) { updates.push(`received_subsidy_amount = $${index++}`); values.push(data.receivedSubsidyAmount); }
        
        if (data.approvedDate !== undefined) { 
            updates.push(`approved_date = ${data.approvedDate ? `$${index++}` : 'NULL'}`); 
            if (data.approvedDate) values.push(data.approvedDate); 
        }
        
        if (data.disbursedDate !== undefined) { 
            updates.push(`disbursed_date = ${data.disbursedDate ? `$${index++}` : 'NULL'}`); 
            if (data.disbursedDate) values.push(data.disbursedDate); 
        }

        if (updates.length === 0) return this.getByUid(tenantUid, uid);

        updates.push(`updated_by = $${index++}`);
        values.push(updatedBy);
        updates.push(`updated_at = CURRENT_TIMESTAMP`);

        values.push(uid, tenantUid);

        const query = `
            UPDATE subsidy_trackers
            SET ${updates.join(", ")}
            WHERE uid = $${index} AND tenant_uid = $${index + 1} AND is_deleted = 0
            RETURNING uid
        `;

        const result = await executor.query(query, values);
        return result.rows.length > 0 ? this.getByUid(tenantUid, uid) : null;
    }

    async listPaginated(tenantUid: string, queryParams: IPaginationQuery): Promise<IPaginatedResponse<any>> {
        const { page = 1, limit = 10, search, portalStatus, netMeterStatus, subsidyUid } = queryParams;
        const offset = (page - 1) * limit;

        let whereClause = `st.tenant_uid = $1 AND st.is_deleted = 0`;
        const values: any[] = [tenantUid];
        let index = 2;

        if (search) {
            whereClause += ` AND (st.name ILIKE $${index} OR p.project_number ILIKE $${index} OR l.first_name ILIKE $${index})`;
            values.push(`%${search}%`);
            index++;
        }

        if (portalStatus !== undefined) {
            whereClause += ` AND st.portal_status = $${index}`;
            values.push(portalStatus);
            index++;
        }

        if (netMeterStatus !== undefined) {
            whereClause += ` AND st.net_meter_status = $${index}`;
            values.push(netMeterStatus);
            index++;
        }

        if (subsidyUid) {
            whereClause += ` AND st.subsidy_uid = $${index}`;
            values.push(subsidyUid);
            index++;
        }

        const countQuery = `
            SELECT COUNT(*) 
            FROM subsidy_trackers st
            LEFT JOIN projects p ON st.project_uid::uuid = p.uid
            LEFT JOIN leads l ON st.lead_uid = l.uid
            WHERE ${whereClause}
        `;
        const countResult = await this.pool.query(countQuery, values);
        const total = parseInt(countResult.rows[0].count, 10);

        const dataQuery = `
            SELECT 
                st.uid, st.name, st.portal_status AS "portalStatus", st.net_meter_status AS "netMeterStatus",
                st.expected_subsidy_amount AS "expectedSubsidyAmount", st.received_subsidy_amount AS "receivedSubsidyAmount",
                st.created_at AS "createdAt", st.updated_at AS "updatedAt",
                p.project_number AS "projectNumber", p.project_name AS "projectName",
                l.first_name AS "customerFirstName", l.last_name AS "customerLastName",
                EXTRACT(DAY FROM (CURRENT_TIMESTAMP - st.created_at)) AS "trackerAgeDays"
            FROM subsidy_trackers st
            LEFT JOIN projects p ON st.project_uid::uuid = p.uid
            LEFT JOIN leads l ON st.lead_uid = l.uid
            WHERE ${whereClause}
            ORDER BY st.id DESC
            LIMIT $${index} OFFSET $${index + 1}
        `;
        
        const dataValues = [...values, limit, offset];
        const dataResult = await this.pool.query(dataQuery, dataValues);

        return {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            data: dataResult.rows,
        };
    }
}

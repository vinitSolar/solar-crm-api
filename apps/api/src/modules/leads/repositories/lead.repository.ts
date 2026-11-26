import type { Pool, PoolClient } from "pg";
import type { ILead, ICreateLead, IUpdateLead } from "../interfaces/lead.interface.js";
import { v4 as uuidv4 } from "uuid";

const LEAD_COLUMNS = `
    id, uid, tenant_uid AS "tenantUid", lead_number AS "leadNumber",
    first_name AS "firstName", last_name AS "lastName", 
    mobile_number AS "mobileNumber", alternate_number AS "alternateNumber", 
    email, address, landmark, locality, state, city, pin_code AS "pinCode",
    monthly_bill_amount AS "monthlyBillAmount", consumer_account_number AS "consumerAccountNumber", system_size AS "systemSize", 
    follow_up_date AS "followUpDate", lead_source_uid AS "leadSourceUid", 
    status_uid AS "statusUid", assigned_to AS "assignedTo",
    category, COALESCE(is_quick_lead, 0) AS "isQuickLead",
    COALESCE(is_follow_up, 0) AS "isFollowUp",
    COALESCE(notify_with_email, 0) AS "notifyWithEmail",
    is_active AS "isActive", is_deleted AS "isDeleted", 
    created_at AS "createdAt", updated_at AS "updatedAt",
    created_by AS "createdBy", updated_by AS "updatedBy", deleted_by AS "deletedBy"
`;

const LEAD_JOIN_COLUMNS = `
    l.id, l.uid, l.tenant_uid AS "tenantUid", l.lead_number AS "leadNumber",
    l.first_name AS "firstName", l.last_name AS "lastName", 
    l.mobile_number AS "mobileNumber", l.alternate_number AS "alternateNumber", 
    l.email, l.address, l.landmark, l.locality, l.state, l.city, l.pin_code AS "pinCode",
    l.monthly_bill_amount AS "monthlyBillAmount", l.consumer_account_number AS "consumerAccountNumber", l.system_size AS "systemSize", 
    l.follow_up_date AS "followUpDate", l.lead_source_uid AS "leadSourceUid", 
    l.status_uid AS "statusUid", l.assigned_to AS "assignedTo", l.category, 
    COALESCE(l.is_quick_lead, 0) AS "isQuickLead",
    COALESCE(l.is_follow_up, 0) AS "isFollowUp",
    COALESCE(l.notify_with_email, 0) AS "notifyWithEmail",
    n.note AS "remarks",
    l.is_active AS "isActive", l.is_deleted AS "isDeleted", 
    l.created_at AS "createdAt", l.updated_at AS "updatedAt",
    l.created_by AS "createdBy", l.updated_by AS "updatedBy", l.deleted_by AS "deletedBy"
`;

const LEAD_RELATIONS_COLUMNS = `
    ls.name AS "statusName", ls.color AS "statusColor", ls.sort_order AS "statusSortOrder", 
    ls.is_default AS "statusIsDefault", ls.is_closed AS "statusIsClosed", ls.is_draft AS "statusIsDraft",
    ls.is_active AS "statusIsActive", ls.is_deleted AS "statusIsDeleted",
    lsrc.name AS "sourceName", lsrc.color AS "sourceColor", lsrc.sort_order AS "sourceSortOrder", 
    lsrc.is_default AS "sourceIsDefault", lsrc.is_active AS "sourceIsActive", lsrc.is_deleted AS "sourceIsDeleted",
    TRIM(CONCAT(u.first_name, ' ', COALESCE(u.last_name, ''))) AS "assignedUserName",
    (
        SELECT q.system_size 
        FROM quotations q 
        WHERE q.lead_uid::varchar = l.uid AND q.is_deleted = 0 
        ORDER BY q.created_at DESC 
        LIMIT 1
    ) AS "finalSystemSize",
    (
        SELECT COUNT(*)::int
        FROM follow_ups fu
        WHERE fu.lead_uid = l.uid AND fu.is_deleted = 0
    ) AS "followUpCount",
    (
        SELECT EXISTS(
            SELECT 1
            FROM site_surveys ss
            WHERE ss.lead_uid = l.uid AND ss.is_deleted = 0 AND ss.status = 1
        )
    ) AS "isSurveyDone",
    (
        SELECT EXISTS(
            SELECT 1
            FROM site_surveys ss
            WHERE ss.lead_uid = l.uid AND ss.is_deleted = 0 AND ss.status IN (0, 1, 3)
        )
    ) AS "hasSurvey"
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
                address, landmark, locality, state, city, pin_code, monthly_bill_amount, consumer_account_number, system_size, follow_up_date, 
                lead_source_uid, status_uid, assigned_to, category, is_quick_lead, is_follow_up, notify_with_email, created_by
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26
            )
            RETURNING ${LEAD_COLUMNS}
        `;
        const notifyWithEmailVal = (data.notifyWithEmail === 1 || data.notifyWithEmail === true || (data as any).notify_with_email === 1 || (data as any).notify_with_email === true) ? 1 : 0;
        const firstName = typeof data.firstName === "string" ? data.firstName.trim().toUpperCase() : data.firstName;
        const lastName = typeof data.lastName === "string" ? data.lastName.trim().toUpperCase() : (data.lastName ?? null);
        const consumerAccountNumber = data.consumerAccountNumber ? String(data.consumerAccountNumber).replace(/\D/g, "").trim() || null : null;
        const values = [
            uid, tenantUid, data.leadNumber, firstName, lastName, data.mobileNumber ?? null, 
            data.alternateNumber ?? null, data.email ?? null, data.address ?? null, 
            data.landmark ?? null, data.locality ?? null, data.state ?? null, data.city ?? null, data.pinCode ?? null, data.monthlyBillAmount ?? null, 
            consumerAccountNumber, data.systemSize ?? null, data.followUpDate || null, data.leadSourceUid ?? null, 
            data.statusUid, data.assignedTo ?? null, data.category ?? 1, data.isQuickLead ? 1 : 0, data.isFollowUp ? 1 : 0, notifyWithEmailVal, createdBy
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
             LEFT JOIN (SELECT DISTINCT ON (module_uid) module_uid, note FROM notes WHERE module = 'lead' AND is_deleted = 0 ORDER BY module_uid, created_at DESC) n ON n.module_uid = l.uid
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

    async getByUidWithDeleted(tenantUid: string, uid: string, client?: PoolClient): Promise<ILead | null> {
        const query = `
             SELECT ${LEAD_JOIN_COLUMNS}, ${LEAD_RELATIONS_COLUMNS}
             FROM leads l
             LEFT JOIN (SELECT DISTINCT ON (module_uid) module_uid, note FROM notes WHERE module = 'lead' AND is_deleted = 0 ORDER BY module_uid, created_at DESC) n ON n.module_uid = l.uid
             LEFT JOIN lead_statuses ls ON l.status_uid = ls.uid 
             LEFT JOIN lead_sources lsrc ON l.lead_source_uid = lsrc.uid
             LEFT JOIN users u ON l.assigned_to = u.uid
             WHERE l.uid = $1 AND l.tenant_uid = $2
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
        status: "active" | "deleted" | "all" = "active",
        assignedTo?: string
    ): Promise<{ rows: ILead[]; total: number }> {
        const params: any[] = [tenantUid];
        let whereClause = "tenant_uid = $1";

        if (status === "active") whereClause += " AND is_deleted = 0";
        else if (status === "deleted") whereClause += " AND is_deleted = 1";

        if (assignedTo) {
            params.push(assignedTo);
            whereClause += ` AND assigned_to = $${params.length}`;
        }

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
            `SELECT COUNT(*) FROM leads l WHERE ${whereClause
                .replace(/tenant_uid/g, 'l.tenant_uid')
                .replace(/is_deleted/g, 'l.is_deleted')
                .replace(/assigned_to/g, 'l.assigned_to')
                .replace(/first_name/g, 'l.first_name')
                .replace(/last_name/g, 'l.last_name')
                .replace(/mobile_number/g, 'l.mobile_number')
                .replace(/email/g, 'l.email')}`,
            params
        );
        const total = parseInt(countResult.rows[0].count, 10);

        const offset = (page - 1) * limit;
        params.push(limit, offset);

        const result = await this.pool.query(
            `SELECT ${LEAD_JOIN_COLUMNS}, ${LEAD_RELATIONS_COLUMNS} 
             FROM leads l
             LEFT JOIN (SELECT DISTINCT ON (module_uid) module_uid, note FROM notes WHERE module = 'lead' AND is_deleted = 0 ORDER BY module_uid, created_at DESC) n ON n.module_uid = l.uid
             LEFT JOIN lead_statuses ls ON l.status_uid = ls.uid 
             LEFT JOIN lead_sources lsrc ON l.lead_source_uid = lsrc.uid
             LEFT JOIN users u ON l.assigned_to = u.uid
             WHERE ${whereClause
                .replace(/tenant_uid/g, 'l.tenant_uid')
                .replace(/is_deleted/g, 'l.is_deleted')
                .replace(/assigned_to/g, 'l.assigned_to')
                .replace(/first_name/g, 'l.first_name')
                .replace(/last_name/g, 'l.last_name')
                .replace(/mobile_number/g, 'l.mobile_number')
                .replace(/email/g, 'l.email')} 
             ORDER BY l.created_at DESC 
             LIMIT $${params.length - 1} OFFSET $${params.length}`,
            params
        );

        return { rows: result.rows as ILead[], total };
    }

    async getAll(
        tenantUid: string,
        status: "active" | "deleted" | "all" = "active",
        assignedTo?: string
    ): Promise<ILead[]> {
        const params: any[] = [tenantUid];
        let whereClause = "l.tenant_uid = $1";

        if (status === "active") whereClause += " AND l.is_deleted = 0";
        else if (status === "deleted") whereClause += " AND l.is_deleted = 1";

        if (assignedTo) {
            params.push(assignedTo);
            whereClause += ` AND l.assigned_to = $${params.length}`;
        }

        const result = await this.pool.query(
            `SELECT ${LEAD_JOIN_COLUMNS}, ${LEAD_RELATIONS_COLUMNS} 
             FROM leads l
             LEFT JOIN (SELECT DISTINCT ON (module_uid) module_uid, note FROM notes WHERE module = 'lead' AND is_deleted = 0 ORDER BY module_uid, created_at DESC) n ON n.module_uid = l.uid
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

        if (data.firstName !== undefined) { 
            const firstName = typeof data.firstName === "string" ? data.firstName.trim().toUpperCase() : data.firstName;
            updates.push(`first_name = $${index++}`); 
            values.push(firstName); 
        }
        if (data.lastName !== undefined) { 
            const lastName = typeof data.lastName === "string" ? data.lastName.trim().toUpperCase() : (data.lastName ?? null);
            updates.push(`last_name = $${index++}`); 
            values.push(lastName); 
        }
        if (data.mobileNumber !== undefined) { updates.push(`mobile_number = $${index++}`); values.push(data.mobileNumber); }
        if (data.alternateNumber !== undefined) { updates.push(`alternate_number = $${index++}`); values.push(data.alternateNumber); }
        if (data.email !== undefined) { updates.push(`email = $${index++}`); values.push(data.email); }
        if (data.address !== undefined) { updates.push(`address = $${index++}`); values.push(data.address); }
        if (data.landmark !== undefined) { updates.push(`landmark = $${index++}`); values.push(data.landmark); }
        if (data.locality !== undefined) { updates.push(`locality = $${index++}`); values.push(data.locality); }
        if (data.state !== undefined) { updates.push(`state = $${index++}`); values.push(data.state); }
        if (data.city !== undefined) { updates.push(`city = $${index++}`); values.push(data.city); }
        if (data.pinCode !== undefined) { updates.push(`pin_code = $${index++}`); values.push(data.pinCode); }
        if (data.monthlyBillAmount !== undefined) { updates.push(`monthly_bill_amount = $${index++}`); values.push(data.monthlyBillAmount); }
        if (data.consumerAccountNumber !== undefined) { 
            const consumerAccountNum = data.consumerAccountNumber ? String(data.consumerAccountNumber).replace(/\D/g, "").trim() || null : null;
            updates.push(`consumer_account_number = $${index++}`); 
            values.push(consumerAccountNum); 
        }
        if (data.systemSize !== undefined) { updates.push(`system_size = $${index++}`); values.push(data.systemSize); }
        if (data.followUpDate !== undefined) { updates.push(`follow_up_date = $${index++}`); values.push(data.followUpDate || null); }
        if (data.leadSourceUid !== undefined) { updates.push(`lead_source_uid = $${index++}`); values.push(data.leadSourceUid); }
        if (data.statusUid !== undefined) { updates.push(`status_uid = $${index++}`); values.push(data.statusUid); }
        if (data.assignedTo !== undefined) { updates.push(`assigned_to = $${index++}`); values.push(data.assignedTo); }
        if (data.category !== undefined) { updates.push(`category = $${index++}`); values.push(data.category); }
        if (data.isQuickLead !== undefined) { updates.push(`is_quick_lead = $${index++}`); values.push(data.isQuickLead ? 1 : 0); }
        if (data.isFollowUp !== undefined) { updates.push(`is_follow_up = $${index++}`); values.push(data.isFollowUp ? 1 : 0); }
        if (data.notifyWithEmail !== undefined || (data as any).notify_with_email !== undefined) {
            const rawVal = data.notifyWithEmail !== undefined ? data.notifyWithEmail : (data as any).notify_with_email;
            const flag = (rawVal === 1 || rawVal === true || rawVal === "1" || rawVal === "true") ? 1 : 0;
            updates.push(`notify_with_email = $${index++}`);
            values.push(flag);
        }

        if (updates.length === 0) return this.getByUid(tenantUid, uid);

        updates.push(`updated_by = $${index++}`);
        values.push(updatedBy);
        updates.push(`updated_at = CURRENT_TIMESTAMP`);

        values.push(uid, tenantUid);

        const result = await this.pool.query(
            `UPDATE leads SET ${updates.join(", ")}
             WHERE uid::varchar = $${index} AND tenant_uid::varchar = $${index + 1} AND is_deleted = 0
             RETURNING uid`,
            values
        );
        return result.rows.length > 0 ? this.getByUid(tenantUid, uid) : null;
    }

    async softDelete(tenantUid: string, uid: string, deletedBy: string, statusUid?: string): Promise<boolean> {
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");

            // 1. Mark lead as is_deleted = 1 (and update status_uid to Archive if provided)
            const result = await client.query(
                `UPDATE leads 
                 SET is_deleted = 1,
                     deleted_by = $1,
                     status_uid = COALESCE($4, status_uid),
                     updated_by = $1,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE uid = $2 AND tenant_uid = $3 AND is_deleted = 0`,
                [deletedBy, uid, tenantUid, statusUid ?? null]
            );
            if ((result.rowCount ?? 0) === 0) {
                await client.query("ROLLBACK");
                return false;
            }

            // 2. Soft-delete and deactivate follow-ups for this lead so they don't show or fire reminders
            await client.query(
                `UPDATE follow_ups 
                 SET is_active = 0, is_deleted = 1, updated_at = CURRENT_TIMESTAMP
                 WHERE lead_uid = $1 AND tenant_uid = $2 AND is_deleted = 0`,
                [uid, tenantUid]
            );

            // 3. Soft-delete connected site surveys so they don't show in surveys
            await client.query(
                `UPDATE site_surveys 
                 SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP, updated_by = $1
                 WHERE lead_uid::varchar = $2 AND tenant_uid::varchar = $3 AND is_deleted = 0`,
                [deletedBy, uid, tenantUid]
            );

            // 4. Soft-delete connected projects so they don't show in projects
            await client.query(
                `UPDATE projects 
                 SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP, updated_by = $1
                 WHERE lead_uid::varchar = $2 AND tenant_uid::varchar = $3 AND is_deleted = 0`,
                [deletedBy, uid, tenantUid]
            );

            // 5. Soft-delete connected quotations
            await client.query(
                `UPDATE quotations 
                 SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP, updated_by = $1
                 WHERE lead_uid::varchar = $2 AND tenant_uid::varchar = $3 AND is_deleted = 0`,
                [deletedBy, uid, tenantUid]
            );

            await client.query("COMMIT");
            return true;
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    async restore(tenantUid: string, uid: string, updatedBy: string, statusUid?: string): Promise<boolean> {
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");

            const result = await client.query(
                `UPDATE leads 
                 SET is_deleted = 0,
                     deleted_by = NULL,
                     status_uid = COALESCE($4, status_uid),
                     updated_by = $1,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE uid = $2 AND tenant_uid = $3 AND is_deleted = 1`,
                [updatedBy, uid, tenantUid, statusUid ?? null]
            );
            if ((result.rowCount ?? 0) === 0) {
                await client.query("ROLLBACK");
                return false;
            }

            // Restore connected surveys, projects, quotations
            await client.query(
                `UPDATE site_surveys 
                 SET is_deleted = 0, updated_at = CURRENT_TIMESTAMP, updated_by = $1
                 WHERE lead_uid::varchar = $2 AND tenant_uid::varchar = $3 AND is_deleted = 1`,
                [updatedBy, uid, tenantUid]
            );
            await client.query(
                `UPDATE projects 
                 SET is_deleted = 0, updated_at = CURRENT_TIMESTAMP, updated_by = $1
                 WHERE lead_uid::varchar = $2 AND tenant_uid::varchar = $3 AND is_deleted = 1`,
                [updatedBy, uid, tenantUid]
            );
            await client.query(
                `UPDATE quotations 
                 SET is_deleted = 0, updated_at = CURRENT_TIMESTAMP, updated_by = $1
                 WHERE lead_uid::varchar = $2 AND tenant_uid::varchar = $3 AND is_deleted = 1`,
                [updatedBy, uid, tenantUid]
            );
            await client.query(
                `UPDATE follow_ups 
                 SET is_deleted = 0, is_active = 1, updated_at = CURRENT_TIMESTAMP
                 WHERE lead_uid = $1 AND tenant_uid = $2 AND is_deleted = 1 AND status = 'scheduled'`,
                [uid, tenantUid]
            );

            await client.query("COMMIT");
            return true;
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    async hardDelete(tenantUid: string, uid: string): Promise<boolean> {
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");

            // Safe helper for child tables using savepoints so missing tables or columns don't abort the transaction
            const safeDelete = async (sql: string, params: any[] = []) => {
                const sp = `sp_${Math.random().toString(36).slice(2, 9)}`;
                await client.query(`SAVEPOINT ${sp}`);
                try {
                    await client.query(sql, params);
                    await client.query(`RELEASE SAVEPOINT ${sp}`);
                } catch {
                    await client.query(`ROLLBACK TO SAVEPOINT ${sp}`);
                }
            };

            // Verify lead belongs to tenant
            const leadCheck = await client.query(
                `SELECT uid FROM leads WHERE uid = $1 AND tenant_uid = $2`,
                [uid, tenantUid]
            );
            if (leadCheck.rows.length === 0) {
                await client.query("ROLLBACK");
                return false;
            }

            // 1. Quotations and quotation children
            const qResult = await client.query(
                `SELECT uid FROM quotations WHERE lead_uid::varchar = $1 AND tenant_uid::varchar = $2`,
                [uid, tenantUid]
            );
            const quotationUids = qResult.rows.map((r: any) => String(r.uid));
            if (quotationUids.length > 0) {
                await safeDelete(
                    `DELETE FROM quotation_items WHERE quotation_uid = ANY($1::varchar[])`,
                    [quotationUids]
                );
                await safeDelete(
                    `DELETE FROM quotation_scope_of_work_items WHERE quotation_uid = ANY($1::varchar[])`,
                    [quotationUids]
                );
                await safeDelete(
                    `DELETE FROM quotation_terms_conditions_items WHERE quotation_uid = ANY($1::varchar[])`,
                    [quotationUids]
                );
                await safeDelete(
                    `DELETE FROM quotations WHERE uid = ANY($1::varchar[])`,
                    [quotationUids]
                );
            }

            // 2. Projects and project children
            const pResult = await client.query(
                `SELECT uid::varchar AS uid FROM projects WHERE lead_uid::varchar = $1 AND tenant_uid::varchar = $2`,
                [uid, tenantUid]
            );
            const projectUids = pResult.rows.map((r: any) => String(r.uid));
            if (projectUids.length > 0) {
                await safeDelete(
                    `DELETE FROM project_installation_milestone_documents 
                     WHERE project_milestone_uid IN (
                         SELECT uid FROM project_installation_milestones WHERE project_uid = ANY($1::varchar[])
                     )`,
                    [projectUids]
                );
                await safeDelete(
                    `DELETE FROM project_installation_milestones WHERE project_uid = ANY($1::varchar[])`,
                    [projectUids]
                );
                await safeDelete(
                    `DELETE FROM project_subsidy_documents WHERE project_uid = ANY($1::varchar[])`,
                    [projectUids]
                );
                await safeDelete(
                    `DELETE FROM projects WHERE uid::varchar = ANY($1::varchar[])`,
                    [projectUids]
                );
            }

            // 3. Subsidy Trackers
            await safeDelete(
                `DELETE FROM subsidy_trackers WHERE (lead_uid::varchar = $1 OR (project_uid IS NOT NULL AND project_uid::varchar = ANY($2::varchar[]))) AND tenant_uid::varchar = $3`,
                [uid, projectUids.length > 0 ? projectUids : ['__none__'], tenantUid]
            );

            // 4. Payments (payments table has lead_uid and tenant_uid, no project_uid)
            await safeDelete(
                `DELETE FROM payments WHERE lead_uid::varchar = $1 AND tenant_uid::varchar = $2`,
                [uid, tenantUid]
            );

            // 5. Site Surveys and survey children
            const ssResult = await client.query(
                `SELECT uid FROM site_surveys WHERE lead_uid::varchar = $1 AND tenant_uid::varchar = $2`,
                [uid, tenantUid]
            );
            const surveyUids = ssResult.rows.map((r: any) => String(r.uid));
            if (surveyUids.length > 0) {
                await safeDelete(
                    `DELETE FROM site_survey_documents WHERE site_survey_uid = ANY($1::varchar[])`,
                    [surveyUids]
                );
                await safeDelete(
                    `DELETE FROM site_survey_details WHERE site_survey_uid = ANY($1::varchar[])`,
                    [surveyUids]
                );
                await safeDelete(
                    `DELETE FROM site_surveys WHERE uid = ANY($1::varchar[])`,
                    [surveyUids]
                );
            }

            // 6. Follow-ups
            await safeDelete(
                `DELETE FROM follow_ups WHERE lead_uid = $1 AND tenant_uid = $2`,
                [uid, tenantUid]
            );

            // 7. Notes
            const allEntityUids = [uid, ...projectUids, ...surveyUids, ...quotationUids];
            await safeDelete(
                `DELETE FROM notes WHERE tenant_uid::varchar = $1 AND (
                    (module = 'lead' AND module_uid::varchar = $2) OR
                    (module IN ('project', 'site_survey', 'quotation', 'payment', 'subsidy_tracker') AND module_uid::varchar = ANY($3::varchar[]))
                )`,
                [tenantUid, uid, allEntityUids]
            );

            // 8. Document associations & master documents
            await safeDelete(
                `DELETE FROM document_associations WHERE tenant_uid::varchar = $1 AND (
                    (module = 'lead' AND context_uid::varchar = $2) OR
                    (module IN ('project', 'site_survey', 'quotation', 'payment', 'subsidy_tracker') AND context_uid::varchar = ANY($3::varchar[]))
                )`,
                [tenantUid, uid, allEntityUids]
            );
            await safeDelete(
                `DELETE FROM master_documents WHERE tenant_uid::varchar = $1 AND (
                    (entity_type = 'lead' AND entity_uid::varchar = $2) OR
                    (entity_type IN ('project', 'site_survey', 'quotation', 'payment', 'subsidy_tracker') AND entity_uid::varchar = ANY($3::varchar[]))
                )`,
                [tenantUid, uid, allEntityUids]
            );

            // 9. WhatsApp sessions
            await safeDelete(
                `DELETE FROM whatsapp_customer_sessions WHERE lead_uid::varchar = $1 AND tenant_uid::varchar = $2`,
                [uid, tenantUid]
            );

            // 10. Customer histories
            await safeDelete(
                `DELETE FROM customer_histories WHERE lead_uid::varchar = $1 AND tenant_uid::varchar = $2`,
                [uid, tenantUid]
            );

            // 11. Notifications
            await safeDelete(
                `DELETE FROM notifications WHERE reference_uid::varchar = ANY($1::varchar[]) AND tenant_uid::varchar = $2`,
                [allEntityUids, tenantUid]
            );

            // 12. Delete the lead record
            const deleteLeadRes = await client.query(
                `DELETE FROM leads WHERE uid = $1 AND tenant_uid = $2`,
                [uid, tenantUid]
            );

            await client.query("COMMIT");
            return (deleteLeadRes.rowCount ?? 0) > 0;
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    async findDuplicates(
        tenantUid: string,
        params: {
            mobileNumber?: string | null | undefined;
            email?: string | null | undefined;
            excludeUid?: string | null | undefined;
        }
    ): Promise<{
        mobileExists: boolean;
        emailExists: boolean;
        existingLead?: {
            uid: string;
            leadNumber: string;
            firstName: string;
            lastName: string;
            mobileNumber: string;
            alternateNumber?: string;
            email?: string;
            isDeleted?: number;
        } | null;
    }> {
        const cleanMobile = params.mobileNumber ? params.mobileNumber.replace(/\D/g, "").slice(-10) : null;
        const cleanEmail = params.email && params.email.trim() ? params.email.trim().toLowerCase() : null;

        if (!cleanMobile && !cleanEmail) {
            return { mobileExists: false, emailExists: false };
        }

        const conditions: string[] = [];
        const values: any[] = [tenantUid];

        let index = 2;
        if (params.excludeUid && String(params.excludeUid).trim()) {
            conditions.push(`l.uid::text != $${index}::text`);
            values.push(String(params.excludeUid).trim());
            index++;
        }

        const matchConditions: string[] = [];

        if (cleanMobile) {
            matchConditions.push(`(
                RIGHT(REGEXP_REPLACE(COALESCE(l.mobile_number, ''), '[^0-9]', '', 'g'), 10) = $${index}
            )`);
            values.push(cleanMobile);
            index++;
        }

        if (cleanEmail) {
            matchConditions.push(`(LOWER(TRIM(COALESCE(l.email, ''))) = $${index})`);
            values.push(cleanEmail);
            index++;
        }

        if (matchConditions.length === 0) {
            return { mobileExists: false, emailExists: false };
        }

        // Check active and soft-deleted leads (is_deleted = 1) so numbers/emails cannot be reused.
        const whereSql = `l.tenant_uid::text = $1::text ${conditions.length ? "AND " + conditions.join(" AND ") : ""} AND (${matchConditions.join(" OR ")})`;

        const query = `
            SELECT l.uid, l.lead_number AS "leadNumber", l.first_name AS "firstName", l.last_name AS "lastName",
                   l.mobile_number AS "mobileNumber", l.alternate_number AS "alternateNumber", l.email,
                   l.is_deleted AS "isDeleted"
            FROM leads l
            WHERE ${whereSql}
            ORDER BY l.is_deleted ASC, l.created_at DESC
            LIMIT 10
        `;

        const result = await this.pool.query(query, values);

        let mobileExists = false;
        let emailExists = false;
        let firstMatch: any = null;

        for (const row of result.rows) {
            const rowMobile = (row.mobileNumber || "").replace(/\D/g, "").slice(-10);
            const rowEmail = (row.email || "").trim().toLowerCase();

            if (cleanMobile && rowMobile === cleanMobile) {
                mobileExists = true;
                if (!firstMatch) firstMatch = row;
            }
            if (cleanEmail && rowEmail === cleanEmail) {
                emailExists = true;
                if (!firstMatch) firstMatch = row;
            }
        }

        return {
            mobileExists,
            emailExists,
            existingLead: firstMatch,
        };
    }

    async getLeadsCursor(
        tenantUid: string,
        limit: number = 5,
        cursorData: { createdAt: Date; id: string | number } | null,
        filters: {
            search?: string | undefined;
            status?: "active" | "deleted" | "all" | undefined;
            statusUid?: string | undefined;
            assignedTo?: string | undefined;
            leadSourceUid?: string | undefined;
            startDate?: string | undefined;
            endDate?: string | undefined;
            followUpDate?: string | undefined;
            isFollowUp?: number | undefined;
            city?: string | undefined;
            state?: string | undefined;
            minCapacity?: number | undefined;
            maxCapacity?: number | undefined;
            sortBy?: "created_at" | "updated_at" | "first_name" | "system_size" | undefined;
            sortOrder?: "asc" | "desc" | undefined;
        }
    ): Promise<{ rows: ILead[]; hasMore: boolean; total: number; allCount: number; statusCounts: Record<string, number> }> {
        const baseParams: any[] = [tenantUid];
        let sharedWhereClause = "l.tenant_uid = $1";

        const status = filters.status || "active";
        let isArchiveStatusFilter = false;
        if (filters.statusUid && status === "active") {
            const archiveCheck = await this.pool.query(
                `SELECT 1 FROM lead_statuses
                 WHERE uid::varchar = $1 AND tenant_uid::varchar = $2 AND is_deleted = 0
                   AND LOWER(TRIM(name)) IN ('archive', 'archived')
                 LIMIT 1`,
                [filters.statusUid, tenantUid]
            );
            isArchiveStatusFilter = archiveCheck.rows.length > 0;
        }

        if (filters.assignedTo) {
            baseParams.push(filters.assignedTo);
            sharedWhereClause += ` AND l.assigned_to = $${baseParams.length}`;
        }

        if (filters.leadSourceUid) {
            baseParams.push(filters.leadSourceUid);
            sharedWhereClause += ` AND l.lead_source_uid = $${baseParams.length}`;
        }

        if (filters.startDate) {
            baseParams.push(new Date(filters.startDate));
            sharedWhereClause += ` AND l.created_at >= $${baseParams.length}`;
        }

        if (filters.endDate) {
            baseParams.push(new Date(filters.endDate));
            sharedWhereClause += ` AND l.created_at <= $${baseParams.length}`;
        }

        if (filters.followUpDate) {
            baseParams.push(filters.followUpDate);
            sharedWhereClause += ` AND l.follow_up_date = $${baseParams.length}`;
        }

        if (filters.isFollowUp !== undefined && !isNaN(Number(filters.isFollowUp))) {
            baseParams.push(Number(filters.isFollowUp));
            sharedWhereClause += ` AND l.is_follow_up = $${baseParams.length}`;
        }

        if (filters.city) {
            baseParams.push(`%${filters.city}%`);
            sharedWhereClause += ` AND l.city ILIKE $${baseParams.length}`;
        }

        if (filters.state) {
            baseParams.push(`%${filters.state}%`);
            sharedWhereClause += ` AND l.state ILIKE $${baseParams.length}`;
        }

        if (filters.minCapacity !== undefined && !isNaN(Number(filters.minCapacity))) {
            baseParams.push(Number(filters.minCapacity));
            sharedWhereClause += ` AND l.system_size >= $${baseParams.length}`;
        }

        if (filters.maxCapacity !== undefined && !isNaN(Number(filters.maxCapacity))) {
            baseParams.push(Number(filters.maxCapacity));
            sharedWhereClause += ` AND l.system_size <= $${baseParams.length}`;
        }

        if (filters.search) {
            baseParams.push(`%${filters.search}%`);
            const sIdx = baseParams.length;
            sharedWhereClause += ` AND (
                l.lead_number ILIKE $${sIdx} OR
                l.first_name ILIKE $${sIdx} OR 
                l.last_name ILIKE $${sIdx} OR 
                l.mobile_number ILIKE $${sIdx} OR 
                l.email ILIKE $${sIdx}
            )`;
        }

        const params: any[] = [...baseParams];
        let whereClause = sharedWhereClause;
        if (status === "deleted" || isArchiveStatusFilter) {
            whereClause += " AND l.is_deleted = 1";
        } else if (status !== "all") {
            whereClause += " AND l.is_deleted = 0";
        }

        if (filters.statusUid) {
            params.push(filters.statusUid);
            whereClause += ` AND l.status_uid = $${params.length}`;
        }

        const sortBy = filters.sortBy || "created_at";
        const sortOrder = (filters.sortOrder || "desc").toLowerCase() === "asc" ? "ASC" : "DESC";
        const isAsc = sortOrder === "ASC";
        const op = isAsc ? ">" : "<";

        let sortColExpr = "l.created_at";
        let cursorDbSelectExpr = "created_at";

        if (sortBy === "updated_at") {
            sortColExpr = "COALESCE(l.updated_at, l.created_at)";
            cursorDbSelectExpr = "COALESCE(updated_at, created_at)";
        } else if (sortBy === "first_name") {
            sortColExpr = "LOWER(COALESCE(l.first_name, ''))";
            cursorDbSelectExpr = "LOWER(COALESCE(first_name, ''))";
        } else if (sortBy === "system_size") {
            sortColExpr = "COALESCE(l.system_size, 0)";
            cursorDbSelectExpr = "COALESCE(system_size, 0)";
        } else {
            sortColExpr = "l.created_at";
            cursorDbSelectExpr = "created_at";
        }

        // Keyset Pagination cursor condition
        if (cursorData) {
            params.push(Number(cursorData.id));
            const cIdIdx = params.length;
            const cursorValExpr = `(SELECT ${cursorDbSelectExpr} FROM leads WHERE id = $${cIdIdx}::bigint)`;
            whereClause += ` AND (${sortColExpr} ${op} ${cursorValExpr} OR (${sortColExpr} = ${cursorValExpr} AND l.id ${op} $${cIdIdx}::bigint))`;
        }

        // Fetch limit + 1 to know if there's a next page without scanning every row
        const fetchLimit = limit + 1;
        params.push(fetchLimit);

        const dataQuery = `
            SELECT ${LEAD_JOIN_COLUMNS}, ${LEAD_RELATIONS_COLUMNS} 
            FROM leads l
            LEFT JOIN (SELECT DISTINCT ON (module_uid) module_uid, note FROM notes WHERE module = 'lead' AND is_deleted = 0 ORDER BY module_uid, created_at DESC) n ON n.module_uid = l.uid
            LEFT JOIN lead_statuses ls ON l.status_uid = ls.uid 
            LEFT JOIN lead_sources lsrc ON l.lead_source_uid = lsrc.uid
            LEFT JOIN users u ON l.assigned_to = u.uid
            WHERE ${whereClause} 
            ORDER BY ${sortColExpr} ${sortOrder}, l.id ${sortOrder} 
            LIMIT $${params.length}
        `;

        let countsWhereClause = sharedWhereClause;
        if (status === "deleted") {
            countsWhereClause += " AND l.is_deleted = 1";
        } else if (status !== "all") {
            countsWhereClause += ` AND (l.is_deleted = 0 OR (l.is_deleted = 1 AND LOWER(TRIM(COALESCE(ls.name, ''))) IN ('archive', 'archived')))`;
        }

        const countsQuery = `
            SELECT l.status_uid AS "statusUid", l.is_deleted AS "isDeleted", COUNT(*)::int AS cnt
            FROM leads l
            LEFT JOIN lead_statuses ls ON l.status_uid = ls.uid
            WHERE ${countsWhereClause}
            GROUP BY l.status_uid, l.is_deleted
        `;

        const [result, countsResult] = await Promise.all([
            this.pool.query(dataQuery, params),
            cursorData ? Promise.resolve(null) : this.pool.query(countsQuery, baseParams),
        ]);

        const rows = result.rows as ILead[];
        const hasMore = rows.length > limit;
        if (hasMore) {
            rows.pop();
        }

        const statusCounts: Record<string, number> = {};
        let allCount = 0;
        if (countsResult) {
            for (const row of countsResult.rows) {
                const count = Number(row.cnt) || 0;
                const rowIsDeleted = Number(row.isDeleted) === 1;
                if (row.statusUid) {
                    const key = String(row.statusUid);
                    statusCounts[key] = (statusCounts[key] ?? 0) + count;
                }
                if (status === "deleted" || status === "all" || !rowIsDeleted) {
                    allCount += count;
                }
            }
        }
        const total = filters.statusUid ? (statusCounts[filters.statusUid] ?? 0) : allCount;

        return { rows, hasMore, total, allCount, statusCounts };
    }

}

/**
 * WhatsApp Self-Service Module — Self-Service CRM Repository
 *
 * Tenant-safe repository for searching customer leads, status, journeys, and executives.
 */

import type { Pool } from "pg";
import pool from "@packages/connection.js";
import type { ICustomerLeadSummary, IAssignedExecutiveInfo } from "../interfaces/whatsapp-self-service.interface.js";

export class WhatsAppSelfServiceRepository {
    private readonly db: Pool;

    constructor(db: Pool = pool) {
        this.db = db;
    }

    /**
     * Search active leads matching normalized phone number or 10-digit national number.
     * Enforces that the parent tenant is active and not deleted.
     */
    async findLeadsByPhoneNumber(
        normalizedPhone: string,
        national10Digit?: string
    ): Promise<ICustomerLeadSummary[]> {
        const params: string[] = [normalizedPhone];
        let phoneCondition = `
            REGEXP_REPLACE(l.mobile_number, '[^0-9]', '', 'g') = $1
            OR REGEXP_REPLACE(COALESCE(l.alternate_number, ''), '[^0-9]', '', 'g') = $1
        `;

        if (national10Digit && national10Digit.length >= 10) {
            params.push(national10Digit);
            phoneCondition += `
                OR RIGHT(REGEXP_REPLACE(l.mobile_number, '[^0-9]', '', 'g'), 10) = $${params.length}
                OR RIGHT(REGEXP_REPLACE(COALESCE(l.alternate_number, ''), '[^0-9]', '', 'g'), 10) = $${params.length}
            `;
        }

        const query = `
            SELECT 
                l.uid,
                l.tenant_uid AS "tenantUid",
                l.lead_number AS "leadNumber",
                l.first_name AS "firstName",
                l.last_name AS "lastName",
                l.system_size AS "systemSize",
                COALESCE(ls.name, 'New') AS "statusName",
                l.assigned_to AS "assignedTo",
                TRIM(CONCAT(u.first_name, ' ', COALESCE(u.last_name, ''))) AS "executiveName",
                u.email AS "executiveEmail",
                l.created_at AS "createdAt",
                l.updated_at AS "updatedAt"
            FROM leads l
            JOIN tenants t ON t.uid = l.tenant_uid AND t.is_active = 1 AND t.is_deleted = 0
            LEFT JOIN lead_statuses ls ON ls.uid = l.status_uid AND ls.is_deleted = 0
            LEFT JOIN users u ON u.uid = l.assigned_to AND u.is_deleted = 0
            WHERE (${phoneCondition})
              AND l.is_deleted = 0
            ORDER BY l.created_at DESC
        `;

        const result = await this.db.query(query, params);

        return result.rows.map((row) => ({
            uid: row.uid,
            tenantUid: row.tenantUid,
            leadNumber: row.leadNumber,
            firstName: row.firstName,
            lastName: row.lastName,
            fullName: `${row.firstName} ${row.lastName || ""}`.trim(),
            systemSize: row.systemSize ? Number(row.systemSize) : null,
            statusName: row.statusName,
            assignedTo: row.assignedTo,
            executiveName: row.executiveName || null,
            executiveEmail: row.executiveEmail || null,
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt)
        }));
    }

    /**
     * Retrieve single lead by UID with tenant isolation
     */
    async getLeadByUid(tenantUid: string, leadUid: string): Promise<ICustomerLeadSummary | null> {
        const query = `
            SELECT 
                l.uid,
                l.tenant_uid AS "tenantUid",
                l.lead_number AS "leadNumber",
                l.first_name AS "firstName",
                l.last_name AS "lastName",
                l.system_size AS "systemSize",
                COALESCE(ls.name, 'New') AS "statusName",
                l.assigned_to AS "assignedTo",
                TRIM(CONCAT(u.first_name, ' ', COALESCE(u.last_name, ''))) AS "executiveName",
                u.email AS "executiveEmail",
                l.created_at AS "createdAt",
                l.updated_at AS "updatedAt"
            FROM leads l
            JOIN tenants t ON t.uid = l.tenant_uid AND t.is_active = 1 AND t.is_deleted = 0
            LEFT JOIN lead_statuses ls ON ls.uid = l.status_uid AND ls.is_deleted = 0
            LEFT JOIN users u ON u.uid = l.assigned_to AND u.is_deleted = 0
            WHERE l.uid = $1 AND l.tenant_uid = $2 AND l.is_deleted = 0
            LIMIT 1
        `;

        const result = await this.db.query(query, [leadUid, tenantUid]);
        if (result.rows.length === 0) return null;

        const row = result.rows[0];
        return {
            uid: row.uid,
            tenantUid: row.tenantUid,
            leadNumber: row.leadNumber,
            firstName: row.firstName,
            lastName: row.lastName,
            fullName: `${row.firstName} ${row.lastName || ""}`.trim(),
            systemSize: row.systemSize ? Number(row.systemSize) : null,
            statusName: row.statusName,
            assignedTo: row.assignedTo,
            executiveName: row.executiveName || null,
            executiveEmail: row.executiveEmail || null,
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt)
        };
    }

    /**
     * Retrieve assigned executive details for a lead
     */
    async getAssignedExecutive(tenantUid: string, userUid: string): Promise<IAssignedExecutiveInfo | null> {
        const query = `
            SELECT 
                first_name AS "firstName",
                last_name AS "lastName",
                email
            FROM users
            WHERE uid = $1 AND tenant_uid = $2 AND is_active = 1 AND is_deleted = 0
            LIMIT 1
        `;
        const result = await this.db.query(query, [userUid, tenantUid]);
        if (result.rows.length === 0) return null;

        const row = result.rows[0];
        return {
            name: `${row.firstName} ${row.lastName || ""}`.trim(),
            email: row.email || null,
            phone: null
        };
    }

    /**
     * Retrieve linked workflow items (Site Survey, Quotation, Project)
     */
    async getLeadWorkflowEntities(tenantUid: string, leadUid: string): Promise<{
        survey: { status: number; scheduledAt: Date; updatedAt: Date } | null;
        quotation: { quotationNumber: string; status: number; updatedAt: Date } | null;
        project: { projectNumber: string; statusName: string | null; updatedAt: Date } | null;
    }> {
        // 1. Site Survey
        const surveyQuery = `
            SELECT status, scheduled_at AS "scheduledAt", updated_at AS "updatedAt"
            FROM site_surveys
            WHERE lead_uid = $1 AND tenant_uid = $2 AND is_deleted = 0
            ORDER BY created_at DESC
            LIMIT 1
        `;
        const surveyRes = await this.db.query(surveyQuery, [leadUid, tenantUid]);

        // 2. Quotation
        const quoteQuery = `
            SELECT quotation_number AS "quotationNumber", status, updated_at AS "updatedAt"
            FROM quotations
            WHERE lead_uid = $1 AND tenant_uid = $2 AND is_deleted = 0
            ORDER BY created_at DESC
            LIMIT 1
        `;
        const quoteRes = await this.db.query(quoteQuery, [leadUid, tenantUid]);

        // 3. Project
        const projectQuery = `
            SELECT p.project_number AS "projectNumber", ps.name AS "statusName", p.updated_at AS "updatedAt"
            FROM projects p
            LEFT JOIN project_statuses ps ON ps.uid = p.project_status_uid
            WHERE p.lead_uid = $1 AND p.tenant_uid = $2 AND p.is_deleted = 0
            ORDER BY p.created_at DESC
            LIMIT 1
        `;
        const projectRes = await this.db.query(projectQuery, [leadUid, tenantUid]);

        return {
            survey: surveyRes.rows[0] ? {
                status: Number(surveyRes.rows[0].status),
                scheduledAt: new Date(surveyRes.rows[0].scheduledAt),
                updatedAt: new Date(surveyRes.rows[0].updatedAt)
            } : null,
            quotation: quoteRes.rows[0] ? {
                quotationNumber: quoteRes.rows[0].quotationNumber,
                status: Number(quoteRes.rows[0].status),
                updatedAt: new Date(quoteRes.rows[0].updatedAt)
            } : null,
            project: projectRes.rows[0] ? {
                projectNumber: projectRes.rows[0].projectNumber,
                statusName: projectRes.rows[0].statusName || null,
                updatedAt: new Date(projectRes.rows[0].updatedAt)
            } : null
        };
    }
}

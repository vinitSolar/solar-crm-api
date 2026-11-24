import type { Pool, PoolClient } from "pg";
import { v4 as uuidv4 } from "uuid";
import type { ICustomerHistory, IQuotationHistoryPayload } from "../interfaces/customer-history.interface.js";

const CUSTOMER_HISTORY_COLUMNS = `
    id, uid, tenant_uid AS "tenantUid", lead_uid AS "leadUid",
    quotation_uid AS "quotationUid", project_uid AS "projectUid",
    lead_number AS "leadNumber", customer_name AS "customerName",
    mobile_number AS "mobileNumber", alternate_number AS "alternateNumber",
    email, address, landmark, locality, city, state, pin_code AS "pinCode",
    category, consumer_account_number AS "consumerAccountNumber",
    monthly_bill_amount AS "monthlyBillAmount", system_size AS "systemSize",
    package_uid AS "packageUid", package_name AS "packageName",
    package_price AS "packagePrice", package_details AS "packageDetails",
    quotation_number AS "quotationNumber", subtotal, gst_amount AS "gstAmount",
    grand_total AS "grandTotal", discount, net_customer_cost AS "netCustomerCost",
    subsidy_amount AS "subsidyAmount", subsidy_details AS "subsidyDetails",
    quotation_snapshot AS "quotationSnapshot",
    project_number AS "projectNumber", project_name AS "projectName",
    project_status AS "projectStatus", project_manager_name AS "projectManagerName",
    project_details AS "projectDetails",
    total_paid AS "totalPaid", payment_details AS "paymentDetails",
    current_status AS "currentStatus", is_closed AS "isClosed",
    closure_status AS "closureStatus", closure_reason AS "closureReason",
    closed_at AS "closedAt", closed_by AS "closedBy",
    is_active AS "isActive", is_deleted AS "isDeleted",
    created_at AS "createdAt", updated_at AS "updatedAt",
    created_by AS "createdBy", updated_by AS "updatedBy"
`;

export class CustomerHistoryRepository {
    private readonly pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    async findByLeadUid(tenantUid: string, leadUid: string, client?: PoolClient): Promise<ICustomerHistory | null> {
        const executor = client || this.pool;
        const query = `
            SELECT ${CUSTOMER_HISTORY_COLUMNS}
            FROM customer_histories
            WHERE tenant_uid = $1 AND lead_uid = $2 AND is_deleted = 0
            ORDER BY created_at DESC
            LIMIT 1
        `;
        const result = await executor.query(query, [tenantUid, leadUid]);
        return result.rows.length > 0 ? (result.rows[0] as ICustomerHistory) : null;
    }

    async findByUid(tenantUid: string, uid: string): Promise<ICustomerHistory | null> {
        const query = `
            SELECT ${CUSTOMER_HISTORY_COLUMNS}
            FROM customer_histories
            WHERE tenant_uid = $1 AND uid = $2 AND is_deleted = 0
            LIMIT 1
        `;
        const result = await this.pool.query(query, [tenantUid, uid]);
        return result.rows.length > 0 ? (result.rows[0] as ICustomerHistory) : null;
    }

    async upsertFromQuotation(
        tenantUid: string,
        leadData: any,
        quotationData: IQuotationHistoryPayload,
        createdBy: string,
        client?: PoolClient
    ): Promise<ICustomerHistory> {
        const executor = client || this.pool;
        const existing = await this.findByLeadUid(tenantUid, quotationData.leadUid, client);

        const customerName = `${leadData.firstName || ""} ${leadData.lastName || ""}`.trim() || leadData.customerName || "Customer";

        if (existing) {
            // Update existing history with latest quotation and package snapshot
            const query = `
                UPDATE customer_histories
                SET
                    quotation_uid = $1,
                    package_uid = $2,
                    package_name = $3,
                    package_price = $4,
                    package_details = $5::jsonb,
                    quotation_number = $6,
                    subtotal = $7,
                    gst_amount = $8,
                    grand_total = $9,
                    discount = $10,
                    net_customer_cost = $11,
                    subsidy_amount = $12,
                    subsidy_details = $13::jsonb,
                    quotation_snapshot = $14::jsonb,
                    lead_number = COALESCE($15, lead_number),
                    customer_name = COALESCE($16, customer_name),
                    mobile_number = COALESCE($17, mobile_number),
                    alternate_number = COALESCE($18, alternate_number),
                    email = COALESCE($19, email),
                    address = COALESCE($20, address),
                    landmark = COALESCE($21, landmark),
                    locality = COALESCE($22, locality),
                    city = COALESCE($23, city),
                    state = COALESCE($24, state),
                    pin_code = COALESCE($25, pin_code),
                    category = COALESCE($26, category),
                    consumer_account_number = COALESCE($27, consumer_account_number),
                    monthly_bill_amount = COALESCE($28, monthly_bill_amount),
                    system_size = COALESCE($29, system_size),
                    current_status = 'QUOTATION_CREATED',
                    updated_at = CURRENT_TIMESTAMP,
                    updated_by = $30
                WHERE uid = $31 AND tenant_uid = $32
                RETURNING ${CUSTOMER_HISTORY_COLUMNS}
            `;
            const values = [
                quotationData.quotationUid,
                quotationData.packageUid || null,
                quotationData.packageName || null,
                quotationData.packagePrice ?? 0,
                JSON.stringify(quotationData.packageDetails || {}),
                quotationData.quotationNumber,
                quotationData.subtotal,
                quotationData.gstAmount,
                quotationData.grandTotal,
                quotationData.discount,
                quotationData.netCustomerCost,
                quotationData.subsidyAmount ?? 0,
                JSON.stringify(quotationData.subsidyDetails || []),
                JSON.stringify(quotationData.quotationSnapshot || {}),
                leadData.leadNumber || null,
                customerName,
                leadData.mobileNumber || null,
                leadData.alternateNumber || null,
                leadData.email || null,
                leadData.address || null,
                leadData.landmark || null,
                leadData.locality || null,
                leadData.city || null,
                leadData.state || null,
                leadData.pinCode || null,
                leadData.category ?? 1,
                leadData.consumerAccountNumber || null,
                leadData.monthlyBillAmount ? Number(leadData.monthlyBillAmount) : null,
                leadData.systemSize ? Number(leadData.systemSize) : null,
                createdBy,
                existing.uid,
                tenantUid
            ];
            const result = await executor.query(query, values);
            return result.rows[0] as ICustomerHistory;
        }

        // Insert new record
        const newUid = uuidv4();
        const query = `
            INSERT INTO customer_histories (
                uid, tenant_uid, lead_uid, quotation_uid,
                lead_number, customer_name, mobile_number, alternate_number, email,
                address, landmark, locality, city, state, pin_code, category,
                consumer_account_number, monthly_bill_amount, system_size,
                package_uid, package_name, package_price, package_details,
                quotation_number, subtotal, gst_amount, grand_total, discount, net_customer_cost,
                subsidy_amount, subsidy_details, quotation_snapshot,
                current_status, is_closed, created_by, updated_by
            )
            VALUES (
                $1, $2, $3, $4,
                $5, $6, $7, $8, $9,
                $10, $11, $12, $13, $14, $15, $16,
                $17, $18, $19,
                $20, $21, $22, $23::jsonb,
                $24, $25, $26, $27, $28, $29,
                $30, $31::jsonb, $32::jsonb,
                'QUOTATION_CREATED', 0, $33, $33
            )
            RETURNING ${CUSTOMER_HISTORY_COLUMNS}
        `;
        const values = [
            newUid, tenantUid, quotationData.leadUid, quotationData.quotationUid,
            leadData.leadNumber || null, customerName, leadData.mobileNumber || null, leadData.alternateNumber || null, leadData.email || null,
            leadData.address || null, leadData.landmark || null, leadData.locality || null, leadData.city || null, leadData.state || null, leadData.pinCode || null, leadData.category ?? 1,
            leadData.consumerAccountNumber || null, leadData.monthlyBillAmount ? Number(leadData.monthlyBillAmount) : null, leadData.systemSize ? Number(leadData.systemSize) : null,
            quotationData.packageUid || null, quotationData.packageName || null, quotationData.packagePrice ?? 0, JSON.stringify(quotationData.packageDetails || {}),
            quotationData.quotationNumber, quotationData.subtotal, quotationData.gstAmount, quotationData.grandTotal, quotationData.discount, quotationData.netCustomerCost,
            quotationData.subsidyAmount ?? 0, JSON.stringify(quotationData.subsidyDetails || []), JSON.stringify(quotationData.quotationSnapshot || {}),
            createdBy
        ];
        const result = await executor.query(query, values);
        return result.rows[0] as ICustomerHistory;
    }

    async updateClosureAndProject(
        tenantUid: string,
        leadUid: string,
        closureData: {
            closureStatus: string;
            closureReason?: string | null;
            closedBy?: string | null;
            projectUid?: string | null;
            projectNumber?: string | null;
            projectName?: string | null;
            projectStatus?: string | null;
            projectManagerName?: string | null;
            projectDetails?: any;
            totalPaid?: number | null;
            paymentDetails?: any;
            leadSnapshot?: any;
        },
        client?: PoolClient
    ): Promise<ICustomerHistory | null> {
        const executor = client || this.pool;
        let existing = await this.findByLeadUid(tenantUid, leadUid, client);

        if (!existing) {
            // If no quotation history existed yet, initialize a closed history record from lead snapshot
            const newUid = uuidv4();
            const lead = closureData.leadSnapshot || {};
            const customerName = `${lead.firstName || ""} ${lead.lastName || ""}`.trim() || lead.customerName || "Customer";
            const insertQuery = `
                INSERT INTO customer_histories (
                    uid, tenant_uid, lead_uid,
                    lead_number, customer_name, mobile_number, alternate_number, email,
                    address, landmark, locality, city, state, pin_code, category,
                    consumer_account_number, monthly_bill_amount, system_size,
                    project_uid, project_number, project_name, project_status, project_manager_name, project_details,
                    total_paid, payment_details,
                    current_status, is_closed, closure_status, closure_reason, closed_at, closed_by,
                    created_by, updated_by
                )
                VALUES (
                    $1, $2, $3,
                    $4, $5, $6, $7, $8,
                    $9, $10, $11, $12, $13, $14, $15,
                    $16, $17, $18,
                    $19, $20, $21, $22, $23, $24::jsonb,
                    $25, $26::jsonb,
                    $27, 1, $28, $29, CURRENT_TIMESTAMP, $30,
                    $30, $30
                )
                RETURNING ${CUSTOMER_HISTORY_COLUMNS}
            `;
            const insertValues = [
                newUid, tenantUid, leadUid,
                lead.leadNumber || null, customerName, lead.mobileNumber || null, lead.alternateNumber || null, lead.email || null,
                lead.address || null, lead.landmark || null, lead.locality || null, lead.city || null, lead.state || null, lead.pinCode || null, lead.category ?? 1,
                lead.consumerAccountNumber || null, lead.monthlyBillAmount ? Number(lead.monthlyBillAmount) : null, lead.systemSize ? Number(lead.systemSize) : null,
                closureData.projectUid || null, closureData.projectNumber || null, closureData.projectName || null, closureData.projectStatus || null, closureData.projectManagerName || null, JSON.stringify(closureData.projectDetails || {}),
                closureData.totalPaid ?? 0, JSON.stringify(closureData.paymentDetails || []),
                closureData.closureStatus.toUpperCase(), closureData.closureStatus, closureData.closureReason || null, closureData.closedBy || null
            ];
            const insertRes = await executor.query(insertQuery, insertValues);
            return insertRes.rows[0] as ICustomerHistory;
        }

        // Update existing history with closure and project/payment details
        const query = `
            UPDATE customer_histories
            SET
                project_uid = COALESCE($1, project_uid),
                project_number = COALESCE($2, project_number),
                project_name = COALESCE($3, project_name),
                project_status = COALESCE($4, project_status),
                project_manager_name = COALESCE($5, project_manager_name),
                project_details = $6::jsonb,
                total_paid = COALESCE($7, total_paid),
                payment_details = $8::jsonb,
                current_status = $9,
                is_closed = 1,
                closure_status = $10,
                closure_reason = $11,
                closed_at = CURRENT_TIMESTAMP,
                closed_by = $12,
                updated_at = CURRENT_TIMESTAMP,
                updated_by = $12
            WHERE uid = $13 AND tenant_uid = $14
            RETURNING ${CUSTOMER_HISTORY_COLUMNS}
        `;
        const values = [
            closureData.projectUid || null,
            closureData.projectNumber || null,
            closureData.projectName || null,
            closureData.projectStatus || null,
            closureData.projectManagerName || null,
            JSON.stringify(closureData.projectDetails || {}),
            closureData.totalPaid ?? 0,
            JSON.stringify(closureData.paymentDetails || []),
            closureData.closureStatus.toUpperCase(),
            closureData.closureStatus,
            closureData.closureReason || null,
            closureData.closedBy || null,
            existing.uid,
            tenantUid
        ];
        const result = await executor.query(query, values);
        return result.rows[0] as ICustomerHistory;
    }

    async findPaginated(
        tenantUid: string,
        page = 1,
        limit = 10,
        filters: { isClosed?: number | undefined; search?: string | undefined } = {}
    ): Promise<{ rows: ICustomerHistory[]; total: number }> {
        const offset = (page - 1) * limit;
        const params: any[] = [tenantUid];
        let where = "tenant_uid = $1 AND is_deleted = 0";

        if (filters.isClosed !== undefined) {
            params.push(filters.isClosed);
            where += ` AND is_closed = $${params.length}`;
        }

        if (filters.search && filters.search.trim()) {
            params.push(`%${filters.search.trim()}%`);
            const sIdx = params.length;
            where += ` AND (
                customer_name ILIKE $${sIdx} OR
                lead_number ILIKE $${sIdx} OR
                mobile_number ILIKE $${sIdx} OR
                email ILIKE $${sIdx} OR
                package_name ILIKE $${sIdx} OR
                project_number ILIKE $${sIdx} OR
                closure_status ILIKE $${sIdx}
            )`;
        }

        const countQuery = `SELECT COUNT(*) FROM customer_histories WHERE ${where}`;
        const countRes = await this.pool.query(countQuery, params);
        const total = parseInt(countRes.rows[0]?.count || "0", 10);

        params.push(limit, offset);
        const dataQuery = `
            SELECT ${CUSTOMER_HISTORY_COLUMNS}
            FROM customer_histories
            WHERE ${where}
            ORDER BY updated_at DESC
            LIMIT $${params.length - 1} OFFSET $${params.length}
        `;
        const dataRes = await this.pool.query(dataQuery, params);

        return {
            rows: dataRes.rows as ICustomerHistory[],
            total
        };
    }
}

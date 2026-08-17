import type { Pool, PoolClient } from "pg";
import { v4 as uuidv4 } from "uuid";
import type {
    IPayment,
    ICreatePayment,
    IUpdatePayment,
    IPaymentSummary,
} from "../interfaces/payment.interface.js";
import type { IPaginationQuery } from "../../leads/interfaces/lead.interface.js";

const PAYMENT_COLUMNS = `
    id, uid, tenant_uid AS "tenantUid", lead_uid AS "leadUid", amount, payment_method AS "paymentMethod",
    transaction_reference AS "transactionReference", payment_date AS "paymentDate", image_proof AS "imageProof", notes,
    is_active AS "isActive", is_deleted AS "isDeleted", created_at AS "createdAt",
    updated_at AS "updatedAt", created_by AS "createdBy", updated_by AS "updatedBy", deleted_by AS "deletedBy"
`;

const PAYMENT_COLUMNS_PREFIXED = `
    p.id, p.uid, p.tenant_uid AS "tenantUid", p.lead_uid AS "leadUid", p.amount, p.payment_method AS "paymentMethod",
    p.transaction_reference AS "transactionReference", p.payment_date AS "paymentDate", p.image_proof AS "imageProof", p.notes,
    p.is_active AS "isActive", p.is_deleted AS "isDeleted", p.created_at AS "createdAt",
    p.updated_at AS "updatedAt", p.created_by AS "createdBy", p.updated_by AS "updatedBy", p.deleted_by AS "deletedBy"
`;

export class PaymentRepository {
    private pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    async create(
        tenantUid: string,
        data: ICreatePayment,
        createdBy: string,
        client?: PoolClient
    ): Promise<IPayment> {
        const dbClient = client || this.pool;
        const uid = uuidv4();

        const query = `
            INSERT INTO payments (
                uid, tenant_uid, lead_uid, amount, payment_method, transaction_reference,
                payment_date, image_proof, notes, created_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING ${PAYMENT_COLUMNS}
        `;

        const values = [
            uid,
            tenantUid,
            data.leadUid,
            data.amount,
            data.paymentMethod,
            data.transactionReference || null,
            data.paymentDate,
            data.imageProof || null,
            data.notes || null,
            createdBy,
        ];

        await dbClient.query(query, values);

        // Re-fetch with totalAmountDue computed
        const created = await this.getByUid(uid, tenantUid, client);
        return created as IPayment;
    }

    async update(
        uid: string,
        tenantUid: string,
        data: IUpdatePayment,
        updatedBy: string,
        client?: PoolClient
    ): Promise<IPayment | null> {
        const dbClient = client || this.pool;
        const setClauses: string[] = [];
        const values: any[] = [];
        let valueIndex = 1;

        const fieldsToUpdate = [
            { key: "amount", dbField: "amount" },
            { key: "paymentMethod", dbField: "payment_method" },
            { key: "transactionReference", dbField: "transaction_reference" },
            { key: "paymentDate", dbField: "payment_date" },
            { key: "imageProof", dbField: "image_proof" },
            { key: "notes", dbField: "notes" },
        ];

        for (const field of fieldsToUpdate) {
            if (data[field.key as keyof IUpdatePayment] !== undefined) {
                setClauses.push(`${field.dbField} = $${valueIndex}`);
                values.push(data[field.key as keyof IUpdatePayment]);
                valueIndex++;
            }
        }

        if (setClauses.length === 0) {
            return this.getByUid(uid, tenantUid, client);
        }

        setClauses.push(`updated_by = $${valueIndex}`);
        values.push(updatedBy);
        valueIndex++;

        setClauses.push(`updated_at = CURRENT_TIMESTAMP`);

        const query = `
            UPDATE payments
            SET ${setClauses.join(", ")}
            WHERE uid = $${valueIndex} AND tenant_uid = $${valueIndex + 1} AND is_deleted = 0
        `;
        values.push(uid, tenantUid);

        const { rowCount } = await dbClient.query(query, values);
        if (!rowCount || rowCount === 0) return null;

        // Re-fetch with totalAmountDue computed
        return this.getByUid(uid, tenantUid, client);
    }

    async getByUid(uid: string, tenantUid: string, client?: PoolClient): Promise<IPayment | null> {
        const dbClient = client || this.pool;
        const query = `
            SELECT
                ${PAYMENT_COLUMNS_PREFIXED},
                COALESCE(q.net_customer_cost, 0) - COALESCE(
                    SUM(p2.amount)
                , 0) AS "totalAmountDue"
            FROM payments p
            LEFT JOIN LATERAL (
                SELECT net_customer_cost
                FROM quotations
                WHERE lead_uid = p.lead_uid::TEXT AND tenant_uid = p.tenant_uid::TEXT AND is_active = 1 AND is_deleted = 0
                ORDER BY created_at DESC
                LIMIT 1
            ) q ON true
            LEFT JOIN payments p2
                ON p2.lead_uid = p.lead_uid
                AND p2.tenant_uid = p.tenant_uid
                AND p2.is_deleted = 0
                AND (p2.payment_date < p.payment_date OR (p2.payment_date = p.payment_date AND p2.id <= p.id))
            WHERE p.uid = $1 AND p.tenant_uid = $2 AND p.is_deleted = 0
            GROUP BY p.id, p.uid, p.tenant_uid, p.lead_uid, p.amount, p.payment_method,
                     p.transaction_reference, p.payment_date, p.notes,
                     p.is_active, p.is_deleted, p.created_at, p.updated_at,
                     p.created_by, p.updated_by, p.deleted_by, q.net_customer_cost
        `;
        const { rows } = await dbClient.query(query, [uid, tenantUid]);
        return (rows[0] as IPayment) || null;
    }

    async getPaginated(
        tenantUid: string,
        queryFilters: IPaginationQuery & { leadUid?: string },
        client?: PoolClient
    ): Promise<{ data: IPayment[]; total: number }> {
        const dbClient = client || this.pool;
        const { page = 1, limit = 10, search, status = "active", leadUid } = queryFilters;
        const offset = (page - 1) * limit;

        const countClauses: string[] = [];
        const dataClauses: string[] = [];
        const values: any[] = [tenantUid];
        let valueIndex = 2;

        countClauses.push("tenant_uid = $1");
        dataClauses.push("p.tenant_uid = $1");

        if (status === "active") {
            countClauses.push("is_deleted = 0");
            dataClauses.push("p.is_deleted = 0");
        } else if (status === "deleted") {
            countClauses.push("is_deleted = 1");
            dataClauses.push("p.is_deleted = 1");
        }

        if (leadUid) {
            countClauses.push(`lead_uid = $${valueIndex}`);
            dataClauses.push(`p.lead_uid = $${valueIndex}`);
            values.push(leadUid);
            valueIndex++;
        }

        if (search) {
            const searchClause = `(
                transaction_reference ILIKE $${valueIndex} OR 
                notes ILIKE $${valueIndex} OR
                CAST(amount AS TEXT) ILIKE $${valueIndex}
            )`;
            const searchClausePrefixed = `(
                p.transaction_reference ILIKE $${valueIndex} OR 
                p.notes ILIKE $${valueIndex} OR
                CAST(p.amount AS TEXT) ILIKE $${valueIndex}
            )`;
            countClauses.push(searchClause);
            dataClauses.push(searchClausePrefixed);
            values.push(`%${search}%`);
            valueIndex++;
        }

        const countWhereString = countClauses.join(" AND ");
        const dataWhereString = dataClauses.join(" AND ");

        const countQuery = `SELECT COUNT(*) FROM payments WHERE ${countWhereString}`;
        const countResult = await dbClient.query(countQuery, values);
        const total = parseInt(countResult.rows[0].count, 10);

        const dataQuery = `
            SELECT
                ${PAYMENT_COLUMNS_PREFIXED},
                COALESCE(q.net_customer_cost, 0) - COALESCE(
                    SUM(p2.amount)
                , 0) AS "totalAmountDue"
            FROM payments p
            LEFT JOIN LATERAL (
                SELECT net_customer_cost
                FROM quotations
                WHERE lead_uid = p.lead_uid::TEXT AND tenant_uid = p.tenant_uid::TEXT AND is_active = 1 AND is_deleted = 0
                ORDER BY created_at DESC
                LIMIT 1
            ) q ON true
            LEFT JOIN payments p2
                ON p2.lead_uid = p.lead_uid
                AND p2.tenant_uid = p.tenant_uid
                AND p2.is_deleted = 0
                AND (p2.payment_date < p.payment_date OR (p2.payment_date = p.payment_date AND p2.id <= p.id))
            WHERE ${dataWhereString}
            GROUP BY p.id, p.uid, p.tenant_uid, p.lead_uid, p.amount, p.payment_method,
                     p.transaction_reference, p.payment_date, p.notes,
                     p.is_active, p.is_deleted, p.created_at, p.updated_at,
                     p.created_by, p.updated_by, p.deleted_by, q.net_customer_cost
            ORDER BY p.payment_date DESC, p.created_at DESC
            LIMIT $${valueIndex} OFFSET $${valueIndex + 1}
        `;
        
        values.push(limit, offset);
        const { rows } = await dbClient.query(dataQuery, values);

        return { data: rows as IPayment[], total };
    }

    async getLeadSummary(leadUid: string, tenantUid: string, client?: PoolClient): Promise<IPaymentSummary> {
        const dbClient = client || this.pool;
        
        // Sum amounts based on status for non-deleted records
        const query = `
            SELECT 
                COUNT(id) AS "totalCount",
                COALESCE(SUM(amount), 0) AS "totalPaid"
            FROM payments
            WHERE lead_uid = $1 AND tenant_uid = $2 AND is_deleted = 0
        `;
        
        const { rows } = await dbClient.query(query, [
            leadUid, 
            tenantUid
        ]);
        
        const result = rows[0];
        
        return {
            totalCount: parseInt(result.totalCount, 10),
            totalPaid: Number(result.totalPaid)
        };
    }

    async softDelete(uid: string, tenantUid: string, deletedBy: string, client?: PoolClient): Promise<boolean> {
        const dbClient = client || this.pool;
        const query = `
            UPDATE payments
            SET is_deleted = 1, is_active = 0, deleted_at = CURRENT_TIMESTAMP, deleted_by = $1
            WHERE uid = $2 AND tenant_uid = $3 AND is_deleted = 0
        `;
        const { rowCount } = await dbClient.query(query, [deletedBy, uid, tenantUid]);
        return (rowCount && rowCount > 0) ? true : false;
    }
}

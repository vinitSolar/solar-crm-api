import type { Pool, PoolClient } from "pg";
import { v4 as uuidv4 } from "uuid";
import type {
    IPayment,
    ICreatePayment,
    IUpdatePayment,
    IPaymentSummary,
} from "../interfaces/payment.interface.js";
import type { IPaginationQuery } from "../../leads/interfaces/lead.interface.js";
import { PAYMENT_STATUS } from "../constants/payment.constants.js";

const PAYMENT_COLUMNS = `
    id, uid, tenant_uid AS "tenantUid", lead_uid AS "leadUid", amount, payment_method AS "paymentMethod",
    transaction_reference AS "transactionReference", payment_date AS "paymentDate", status, notes,
    is_active AS "isActive", is_deleted AS "isDeleted", created_at AS "createdAt",
    updated_at AS "updatedAt", created_by AS "createdBy", updated_by AS "updatedBy", deleted_by AS "deletedBy"
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
                payment_date, status, notes, created_by
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
            data.status ?? PAYMENT_STATUS.PENDING,
            data.notes || null,
            createdBy,
        ];

        const { rows } = await dbClient.query(query, values);
        return rows[0] as IPayment;
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
            { key: "status", dbField: "status" },
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
            RETURNING ${PAYMENT_COLUMNS}
        `;
        values.push(uid, tenantUid);

        const { rows } = await dbClient.query(query, values);
        return (rows[0] as IPayment) || null;
    }

    async getByUid(uid: string, tenantUid: string, client?: PoolClient): Promise<IPayment | null> {
        const dbClient = client || this.pool;
        const query = `
            SELECT ${PAYMENT_COLUMNS}
            FROM payments
            WHERE uid = $1 AND tenant_uid = $2 AND is_deleted = 0
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

        let whereClauses = ["tenant_uid = $1"];
        const values: any[] = [tenantUid];
        let valueIndex = 2;

        if (status === "active") {
            whereClauses.push(`is_deleted = 0`);
        } else if (status === "deleted") {
            whereClauses.push(`is_deleted = 1`);
        }

        if (leadUid) {
            whereClauses.push(`lead_uid = $${valueIndex}`);
            values.push(leadUid);
            valueIndex++;
        }

        if (search) {
            whereClauses.push(`
                (
                    transaction_reference ILIKE $${valueIndex} OR 
                    notes ILIKE $${valueIndex} OR
                    CAST(amount AS TEXT) ILIKE $${valueIndex}
                )
            `);
            values.push(`%${search}%`);
            valueIndex++;
        }

        const whereString = whereClauses.join(" AND ");

        const countQuery = `SELECT COUNT(*) FROM payments WHERE ${whereString}`;
        const countResult = await dbClient.query(countQuery, values);
        const total = parseInt(countResult.rows[0].count, 10);

        const dataQuery = `
            SELECT ${PAYMENT_COLUMNS}
            FROM payments
            WHERE ${whereString}
            ORDER BY payment_date DESC, created_at DESC
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
                COALESCE(SUM(CASE WHEN status = $3 THEN amount ELSE 0 END), 0) AS "totalPaid",
                COALESCE(SUM(CASE WHEN status = $4 THEN amount ELSE 0 END), 0) AS "totalPending",
                COALESCE(SUM(CASE WHEN status = $5 THEN amount ELSE 0 END), 0) AS "totalRefunded"
            FROM payments
            WHERE lead_uid = $1 AND tenant_uid = $2 AND is_deleted = 0
        `;
        
        const { rows } = await dbClient.query(query, [
            leadUid, 
            tenantUid, 
            PAYMENT_STATUS.PAID, 
            PAYMENT_STATUS.PENDING,
            PAYMENT_STATUS.REFUNDED
        ]);
        
        const result = rows[0];
        
        return {
            totalCount: parseInt(result.totalCount, 10),
            totalPaid: Number(result.totalPaid),
            totalPending: Number(result.totalPending),
            totalRefunded: Number(result.totalRefunded),
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

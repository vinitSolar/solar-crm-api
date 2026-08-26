import type { Pool, PoolClient } from "pg";
import type { IBankDetail, ICreateBankDetail, IUpdateBankDetail } from "../interfaces/bank-detail.interface.js";
import { v4 as uuidv4 } from "uuid";

const BANK_DETAIL_COLUMNS = `
    id, uid, tenant_uid AS "tenantUid",
    account_name AS "accountName", account_number AS "accountNumber",
    ifsc_code AS "ifscCode", bank_name AS "bankName", branch_name AS "branchName",
    swift_code AS "swiftCode", upi_id AS "upiId",
    is_default AS "isDefault", is_active AS "isActive", is_deleted AS "isDeleted",
    created_at AS "createdAt", updated_at AS "updatedAt",
    created_by AS "createdBy", updated_by AS "updatedBy", deleted_by AS "deletedBy"
`;

export class BankDetailRepository {
    private readonly pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    async create(
        tenantUid: string,
        data: ICreateBankDetail,
        createdBy: string,
        client?: PoolClient
    ): Promise<IBankDetail> {
        const uid = uuidv4();
        
        // Ensure this is the only default
        await this.unsetAllDefaults(tenantUid, client);
        
        const query = `
            INSERT INTO bank_details (
                uid, tenant_uid, account_name, account_number, ifsc_code,
                bank_name, branch_name, swift_code, upi_id, is_default, created_by
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, 1, $10
            )
            RETURNING ${BANK_DETAIL_COLUMNS}
        `;
        const values = [
            uid, tenantUid, data.accountName, data.accountNumber, data.ifscCode,
            data.bankName, data.branchName, data.swiftCode || null, data.upiId || null, createdBy
        ];

        const result = client 
            ? await client.query(query, values) 
            : await this.pool.query(query, values);
            
        return result.rows[0] as IBankDetail;
    }

    async getByUid(tenantUid: string, uid: string, client?: PoolClient): Promise<IBankDetail | null> {
        const query = `
             SELECT ${BANK_DETAIL_COLUMNS}
             FROM bank_details
             WHERE uid = $1 AND tenant_uid = $2 AND is_deleted = 0
        `;
        const result = client
            ? await client.query(query, [uid, tenantUid])
            : await this.pool.query(query, [uid, tenantUid]);
        return result.rows.length > 0 ? (result.rows[0] as IBankDetail) : null;
    }

    async getDefault(tenantUid: string, client?: PoolClient): Promise<IBankDetail | null> {
        const query = `
             SELECT ${BANK_DETAIL_COLUMNS}
             FROM bank_details
             WHERE tenant_uid = $1 AND is_deleted = 0 AND is_default = 1
             LIMIT 1
        `;
        const result = client
            ? await client.query(query, [tenantUid])
            : await this.pool.query(query, [tenantUid]);
        return result.rows.length > 0 ? (result.rows[0] as IBankDetail) : null;
    }
    
    async getAll(tenantUid: string, client?: PoolClient): Promise<IBankDetail[]> {
        const query = `
             SELECT ${BANK_DETAIL_COLUMNS}
             FROM bank_details
             WHERE tenant_uid = $1 AND is_deleted = 0
             ORDER BY created_at DESC
        `;
        const result = client
            ? await client.query(query, [tenantUid])
            : await this.pool.query(query, [tenantUid]);
        return result.rows as IBankDetail[];
    }

    async update(tenantUid: string, uid: string, data: IUpdateBankDetail, updatedBy: string): Promise<IBankDetail | null> {
        const updates: string[] = [];
        const values: any[] = [];
        let index = 1;

        if (data.accountName !== undefined) { updates.push(`account_name = $${index++}`); values.push(data.accountName); }
        if (data.accountNumber !== undefined) { updates.push(`account_number = $${index++}`); values.push(data.accountNumber); }
        if (data.ifscCode !== undefined) { updates.push(`ifsc_code = $${index++}`); values.push(data.ifscCode); }
        if (data.bankName !== undefined) { updates.push(`bank_name = $${index++}`); values.push(data.bankName); }
        if (data.branchName !== undefined) { updates.push(`branch_name = $${index++}`); values.push(data.branchName); }
        if (data.swiftCode !== undefined) { updates.push(`swift_code = $${index++}`); values.push(data.swiftCode); }
        if (data.upiId !== undefined) { updates.push(`upi_id = $${index++}`); values.push(data.upiId); }

        if (updates.length === 0) return this.getByUid(tenantUid, uid);

        updates.push(`updated_by = $${index++}`);
        values.push(updatedBy);
        updates.push(`updated_at = CURRENT_TIMESTAMP`);

        values.push(uid, tenantUid);

        const result = await this.pool.query(
            `UPDATE bank_details SET ${updates.join(", ")}
             WHERE uid = $${index} AND tenant_uid = $${index + 1} AND is_deleted = 0
             RETURNING uid`,
            values
        );
        return result.rows.length > 0 ? this.getByUid(tenantUid, uid) : null;
    }

    async softDelete(tenantUid: string, uid: string, deletedBy: string): Promise<boolean> {
        const result = await this.pool.query(
            `UPDATE bank_details 
             SET is_deleted = 1, deleted_by = $1, updated_at = CURRENT_TIMESTAMP
             WHERE uid = $2 AND tenant_uid = $3 AND is_deleted = 0`,
            [deletedBy, uid, tenantUid]
        );
        return (result.rowCount ?? 0) > 0;
    }
    
    private async unsetAllDefaults(tenantUid: string, client?: PoolClient): Promise<void> {
        const query = `UPDATE bank_details SET is_default = 0 WHERE tenant_uid = $1 AND is_deleted = 0`;
        if (client) {
            await client.query(query, [tenantUid]);
        } else {
            await this.pool.query(query, [tenantUid]);
        }
    }

    async isHeadOffice(tenantUid: string): Promise<boolean> {
        const result = await this.pool.query(`SELECT type FROM tenants WHERE uid = $1 AND is_deleted = 0`, [tenantUid]);
        if (result.rows.length === 0) return false;
        return result.rows[0].type === 0;
    }
}

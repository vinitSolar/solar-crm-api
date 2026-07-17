import type { Pool, PoolClient } from "pg";
import { v4 as uuidv4 } from "uuid";
import type {
    IAuditLog,
    IAuditLogPayload,
    IAuditLogListRequest
} from "../types/audit-logs.types.js";

const AUDIT_LOG_COLUMNS = `
    id, uid, tenant_uid AS "tenantUid", module, record_uid AS "recordUid",
    action, message, metadata, ip_address AS "ipAddress", user_agent AS "userAgent",
    created_at AS "createdAt", created_by AS "createdBy"
`;

export class AuditLogRepository {
    private pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    /**
     * Store multiple audit logs (used by the update calculation service)
     */
    async createMany(logs: IAuditLogPayload[], client?: PoolClient): Promise<void> {
        if (!logs.length) return;
        
        const dbClient = client || this.pool;
        
        // Build values string for batch insert
        const values: any[] = [];
        const placeholders: string[] = [];
        
        logs.forEach((log, index) => {
            const offset = index * 9;
            placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9})`);
            
            values.push(
                log.tenantUid || null,
                log.module,
                log.recordUid,
                log.action,
                log.message,
                log.metadata ? JSON.stringify(log.metadata) : null,
                log.ipAddress || null,
                log.userAgent || null,
                log.createdBy || null
            );
        });

        const query = `
            INSERT INTO audit_logs (tenant_uid, module, record_uid, action, message, metadata, ip_address, user_agent, created_by)
            VALUES ${placeholders.join(', ')}
        `;

        await dbClient.query(query, values);
    }

    /**
     * Store a single audit log
     */
    async create(log: IAuditLogPayload, client?: PoolClient): Promise<IAuditLog> {
        const dbClient = client || this.pool;
        
        const query = `
            INSERT INTO audit_logs (
                tenant_uid, module, record_uid, action, message, metadata, ip_address, user_agent, created_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING ${AUDIT_LOG_COLUMNS}
        `;
        
        const values = [
            log.tenantUid || null,
            log.module,
            log.recordUid,
            log.action,
            log.message,
            log.metadata || null,
            log.ipAddress || null,
            log.userAgent || null,
            log.createdBy || null
        ];

        const { rows } = await dbClient.query(query, values);
        return rows[0] as IAuditLog;
    }

    /**
     * Fetch paginated audit logs
     */
    async list(params: IAuditLogListRequest): Promise<{ logs: IAuditLog[], total: number }> {
        const { page = 1, limit = 10, search, filters } = params;
        const offset = (page - 1) * limit;

        let whereClauses: string[] = ["1=1"];
        let values: any[] = [];
        let valueIndex = 1;

        if (search) {
            whereClauses.push(`message ILIKE $${valueIndex}`);
            values.push(`%${search}%`);
            valueIndex++;
        }

        if (filters?.module) {
            whereClauses.push(`module = $${valueIndex}`);
            values.push(filters.module);
            valueIndex++;
        }

        if (filters?.recordUid) {
            whereClauses.push(`record_uid = $${valueIndex}`);
            values.push(filters.recordUid);
            valueIndex++;
        }

        if (filters?.tenantUid) {
            whereClauses.push(`tenant_uid = $${valueIndex}`);
            values.push(filters.tenantUid);
            valueIndex++;
        }

        if (filters?.createdBy) {
            whereClauses.push(`created_by = $${valueIndex}`);
            values.push(filters.createdBy);
            valueIndex++;
        }

        if (filters?.action) {
            whereClauses.push(`action = $${valueIndex}`);
            values.push(filters.action);
            valueIndex++;
        }

        if (filters?.startDate) {
            whereClauses.push(`created_at >= $${valueIndex}`);
            values.push(filters.startDate);
            valueIndex++;
        }

        if (filters?.endDate) {
            whereClauses.push(`created_at <= $${valueIndex}`);
            values.push(filters.endDate);
            valueIndex++;
        }

        const whereString = whereClauses.join(" AND ");

        const countQuery = `SELECT COUNT(*) FROM audit_logs WHERE ${whereString}`;
        const countResult = await this.pool.query(countQuery, values);
        const total = parseInt(countResult.rows[0].count, 10);

        const dataQuery = `
            SELECT ${AUDIT_LOG_COLUMNS}
            FROM audit_logs
            WHERE ${whereString}
            ORDER BY created_at DESC
            LIMIT $${valueIndex} OFFSET $${valueIndex + 1}
        `;
        
        values.push(limit, offset);
        const { rows } = await this.pool.query(dataQuery, values);

        return { logs: rows as IAuditLog[], total };
    }
}

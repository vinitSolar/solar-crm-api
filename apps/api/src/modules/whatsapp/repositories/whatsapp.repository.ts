/**
 * WhatsApp Module — Repository
 *
 * Database access layer for whatsapp_messages table.
 */

import type { Pool, PoolClient } from "pg";
import pool from "@packages/connection.js";
import { v4 as uuidv4 } from "uuid";
import type {
    ICreateWhatsAppMessage,
    IWhatsAppMessage,
    IWhatsAppMessageFilter,
    IWhatsAppMessageSafe
} from "../interfaces/whatsapp.interface.js";
import type { WhatsAppMessageStatus } from "../constants/whatsapp.constants.js";

export class WhatsAppRepository {
    private readonly pool: Pool;

    constructor() {
        this.pool = pool;
    }

    /**
     * Map database row (snake_case) to domain object (camelCase)
     */
    private mapRowToDomain(row: Record<string, any>): IWhatsAppMessage {
        return {
            id: row.id,
            uid: row.uid,
            tenantUid: row.tenant_uid,
            direction: row.direction,
            waMessageId: row.wa_message_id,
            fromNumber: row.from_number,
            toNumber: row.to_number,
            messageType: row.message_type,
            content: row.content,
            templateName: row.template_name,
            templateData: typeof row.template_data === "string" ? JSON.parse(row.template_data) : (row.template_data || {}),
            status: row.status,
            statusTimestamp: row.status_timestamp ? new Date(row.status_timestamp) : null,
            errorCode: row.error_code,
            errorMessage: row.error_message,
            rawPayload: typeof row.raw_payload === "string" ? JSON.parse(row.raw_payload) : (row.raw_payload || {}),
            isActive: row.is_active,
            isDeleted: row.is_deleted,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
            deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
            createdBy: row.created_by,
            updatedBy: row.updated_by,
            deletedBy: row.deleted_by
        };
    }

    /**
     * Transform internal entity to safe external DTO
     */
    toSafe(msg: IWhatsAppMessage): IWhatsAppMessageSafe {
        return {
            uid: msg.uid,
            tenantUid: msg.tenantUid,
            direction: msg.direction,
            waMessageId: msg.waMessageId,
            fromNumber: msg.fromNumber,
            toNumber: msg.toNumber,
            messageType: msg.messageType,
            content: msg.content,
            templateName: msg.templateName,
            status: msg.status,
            statusTimestamp: msg.statusTimestamp,
            errorCode: msg.errorCode,
            errorMessage: msg.errorMessage,
            createdAt: msg.createdAt
        };
    }

    /**
     * Create a new WhatsApp message log record
     */
    async createMessage(
        data: ICreateWhatsAppMessage,
        client?: PoolClient
    ): Promise<IWhatsAppMessage> {
        const executor = client || this.pool;
        const uid = uuidv4();

        const sql = `
            INSERT INTO whatsapp_messages (
                uid, tenant_uid, direction, wa_message_id,
                from_number, to_number, message_type, content,
                template_name, template_data, status, error_code,
                error_message, raw_payload, created_by
            )
            VALUES (
                $1, $2, $3, $4,
                $5, $6, $7, $8,
                $9, $10, $11, $12,
                $13, $14, $15
            )
            RETURNING *;
        `;

        const values = [
            uid,
            data.tenantUid || null,
            data.direction,
            data.waMessageId || null,
            data.fromNumber,
            data.toNumber,
            data.messageType,
            data.content || null,
            data.templateName || null,
            JSON.stringify(data.templateData || {}),
            data.status,
            data.errorCode || null,
            data.errorMessage || null,
            JSON.stringify(data.rawPayload || {}),
            data.createdBy || null
        ];

        const result = await executor.query(sql, values);
        return this.mapRowToDomain(result.rows[0]);
    }

    /**
     * Update message status by Meta WhatsApp Message ID (wamid.XXX)
     */
    async updateStatusByWaMessageId(
        waMessageId: string,
        status: WhatsAppMessageStatus,
        statusTimestamp?: Date,
        errorCode?: string,
        errorMessage?: string,
        client?: PoolClient
    ): Promise<IWhatsAppMessage | null> {
        const executor = client || this.pool;

        const sql = `
            UPDATE whatsapp_messages
            SET
                status = $1,
                status_timestamp = COALESCE($2, NOW()),
                error_code = COALESCE($3, error_code),
                error_message = COALESCE($4, error_message),
                updated_at = NOW()
            WHERE wa_message_id = $5 AND is_deleted = 0
            RETURNING *;
        `;

        const values = [
            status,
            statusTimestamp || null,
            errorCode || null,
            errorMessage || null,
            waMessageId
        ];

        const result = await executor.query(sql, values);
        if (result.rows.length === 0) return null;
        return this.mapRowToDomain(result.rows[0]);
    }

    /**
     * Find message by Meta WhatsApp Message ID
     */
    async findByWaMessageId(
        waMessageId: string,
        client?: PoolClient
    ): Promise<IWhatsAppMessage | null> {
        const executor = client || this.pool;
        const sql = `
            SELECT * FROM whatsapp_messages
            WHERE wa_message_id = $1 AND is_deleted = 0
            LIMIT 1;
        `;
        const result = await executor.query(sql, [waMessageId]);
        if (result.rows.length === 0) return null;
        return this.mapRowToDomain(result.rows[0]);
    }

    /**
     * Find message by internal UID
     */
    async findByUid(
        uid: string,
        client?: PoolClient
    ): Promise<IWhatsAppMessage | null> {
        const executor = client || this.pool;
        const sql = `
            SELECT * FROM whatsapp_messages
            WHERE uid = $1 AND is_deleted = 0
            LIMIT 1;
        `;
        const result = await executor.query(sql, [uid]);
        if (result.rows.length === 0) return null;
        return this.mapRowToDomain(result.rows[0]);
    }

    /**
     * Get paginated messages list with filtering and search
     */
    async findPaginated(
        filter: IWhatsAppMessageFilter,
        tenantUid?: string | null,
        client?: PoolClient
    ): Promise<{ messages: IWhatsAppMessage[]; total: number }> {
        const executor = client || this.pool;
        const page = filter.page || 1;
        const limit = filter.limit || 20;
        const offset = (page - 1) * limit;

        const whereClauses: string[] = ["is_deleted = 0"];
        const params: any[] = [];
        let paramIndex = 1;

        if (tenantUid) {
            whereClauses.push(`tenant_uid = $${paramIndex++}`);
            params.push(tenantUid);
        }

        if (filter.direction && filter.direction !== "all") {
            whereClauses.push(`direction = $${paramIndex++}`);
            params.push(filter.direction);
        }

        if (filter.status && filter.status !== "all") {
            whereClauses.push(`status = $${paramIndex++}`);
            params.push(filter.status);
        }

        if (filter.search) {
            whereClauses.push(
                `(from_number ILIKE $${paramIndex} OR to_number ILIKE $${paramIndex} OR content ILIKE $${paramIndex})`
            );
            params.push(`%${filter.search}%`);
            paramIndex++;
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

        // Total count query
        const countSql = `SELECT COUNT(*) AS total FROM whatsapp_messages ${whereSql};`;
        const countResult = await executor.query(countSql, params);
        const total = parseInt(countResult.rows[0].total, 10);

        // Data query
        const dataSql = `
            SELECT * FROM whatsapp_messages
            ${whereSql}
            ORDER BY created_at DESC
            LIMIT $${paramIndex++} OFFSET $${paramIndex++};
        `;
        params.push(limit, offset);

        const dataResult = await executor.query(dataSql, params);
        const messages = dataResult.rows.map((row) => this.mapRowToDomain(row));

        return { messages, total };
    }
}

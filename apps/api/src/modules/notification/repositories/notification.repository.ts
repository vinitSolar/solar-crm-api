/**
 * Notification Module — Repository
 *
 * Database operations for the notification_logs table.
 */

import type { Pool, PoolClient } from "pg";
import pool from "@packages/connection.js";
import { v4 as uuidv4 } from "uuid";
import type { ICreateNotificationLog, INotificationLog } from "../interfaces/notification.interfaces.js";

export class NotificationRepository {
    private readonly pool: Pool;

    constructor() {
        this.pool = pool;
    }

    /**
     * Creates a new notification log entry.
     */
    async createLog(
        data: ICreateNotificationLog,
        createdBy?: string,
        client?: PoolClient
    ): Promise<INotificationLog> {
        const uid = uuidv4();
        const query = `
            INSERT INTO notification_logs (
                uid, tenant_uid, module, reference_uid, channel,
                template, recipient, status, delivery_mode,
                error_message, retry_count, sent_at, created_by
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
            )
            RETURNING
                id, uid,
                tenant_uid AS "tenantUid",
                module,
                reference_uid AS "referenceUid",
                channel,
                template,
                recipient,
                status,
                delivery_mode AS "deliveryMode",
                error_message AS "errorMessage",
                retry_count AS "retryCount",
                sent_at AS "sentAt",
                is_active AS "isActive",
                is_deleted AS "isDeleted",
                created_at AS "createdAt",
                updated_at AS "updatedAt",
                created_by AS "createdBy",
                updated_by AS "updatedBy",
                deleted_by AS "deletedBy"
        `;
        const values = [
            uid,
            data.tenantUid,
            data.module,
            data.referenceUid,
            data.channel,
            data.template,
            data.recipient,
            data.status,
            data.deliveryMode,
            data.errorMessage ?? null,
            data.retryCount ?? 0,
            data.sentAt ?? null,
            createdBy ?? null
        ];

        const executor = client ?? this.pool;
        const result = await executor.query(query, values);
        return result.rows[0] as INotificationLog;
    }

    /**
     * Updates the status of an existing notification log.
     */
    async updateStatus(
        uid: string,
        status: number,
        errorMessage?: string | null,
        sentAt?: Date | null,
        client?: PoolClient
    ): Promise<boolean> {
        const query = `
            UPDATE notification_logs
            SET
                status = $1,
                error_message = $2,
                sent_at = $3,
                updated_at = CURRENT_TIMESTAMP
            WHERE uid = $4 AND is_deleted = 0
        `;
        const values = [
            status,
            errorMessage ?? null,
            sentAt ?? null,
            uid
        ];

        const executor = client ?? this.pool;
        const result = await executor.query(query, values);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Updates the delivery mode of an existing notification log.
     */
    async updateDeliveryMode(
        uid: string,
        deliveryMode: number,
        client?: PoolClient
    ): Promise<boolean> {
        const query = `
            UPDATE notification_logs
            SET
                delivery_mode = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE uid = $2 AND is_deleted = 0
        `;
        const values = [deliveryMode, uid];

        const executor = client ?? this.pool;
        const result = await executor.query(query, values);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Increments the retry count for a notification log entry.
     */
    async incrementRetryCount(
        uid: string,
        client?: PoolClient
    ): Promise<boolean> {
        const query = `
            UPDATE notification_logs
            SET
                retry_count = retry_count + 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE uid = $1 AND is_deleted = 0
        `;

        const executor = client ?? this.pool;
        const result = await executor.query(query, [uid]);
        return (result.rowCount ?? 0) > 0;
    }
}

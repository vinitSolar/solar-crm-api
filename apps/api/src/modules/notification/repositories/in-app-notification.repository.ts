/**
 * Notification Module — In-App Notification Repository
 *
 * Database operations for the notifications table.
 */

import type { Pool, PoolClient } from "pg";
import pool from "@packages/connection.js";
import { v4 as uuidv4 } from "uuid";
import type {
    INotification,
    ICreateInAppNotification,
    IGetNotificationsFilter
} from "../interfaces/in-app-notification.interface.js";

export class InAppNotificationRepository {
    private readonly pool: Pool;

    constructor(customPool?: Pool) {
        this.pool = customPool ?? pool;
    }

    private getBaseSelectQuery(): string {
        return `
            SELECT
                id,
                uid,
                tenant_uid AS "tenantUid",
                user_uid AS "userUid",
                title,
                body,
                module,
                reference_uid AS "referenceUid",
                template,
                data,
                is_read AS "isRead",
                read_at AS "readAt",
                is_active AS "isActive",
                is_deleted AS "isDeleted",
                created_at AS "createdAt",
                updated_at AS "updatedAt",
                deleted_at AS "deletedAt",
                created_by AS "createdBy",
                updated_by AS "updatedBy",
                deleted_by AS "deletedBy"
            FROM notifications
        `;
    }

    /**
     * Creates a new in-app notification record.
     */
    async createNotification(
        data: ICreateInAppNotification,
        client?: PoolClient
    ): Promise<INotification> {
        const uid = uuidv4();
        const query = `
            INSERT INTO notifications (
                uid, tenant_uid, user_uid, title, body,
                module, reference_uid, template, data,
                is_read, is_active, is_deleted, created_by
            )
            VALUES (
                $1, $2, $3, $4, $5,
                $6, $7, $8, $9,
                0, 1, 0, $10
            )
            RETURNING
                id, uid,
                tenant_uid AS "tenantUid",
                user_uid AS "userUid",
                title, body, module,
                reference_uid AS "referenceUid",
                template, data,
                is_read AS "isRead",
                read_at AS "readAt",
                is_active AS "isActive",
                is_deleted AS "isDeleted",
                created_at AS "createdAt",
                updated_at AS "updatedAt",
                deleted_at AS "deletedAt",
                created_by AS "createdBy",
                updated_by AS "updatedBy",
                deleted_by AS "deletedBy"
        `;
        const values = [
            uid,
            data.tenantUid,
            data.userUid,
            data.title,
            data.body,
            data.module ?? "crm",
            data.referenceUid ?? null,
            data.template ?? null,
            JSON.stringify(data.data ?? {}),
            data.createdBy ?? null
        ];

        const executor = client ?? this.pool;
        const result = await executor.query(query, values);
        return result.rows[0] as INotification;
    }

    /**
     * Fetches paginated notifications for a user with search and read/delete status filters.
     */
    async getPaginated(
        tenantUid: string,
        userUid: string,
        filter: IGetNotificationsFilter
    ): Promise<{ rows: INotification[]; total: number }> {
        const conditions: string[] = ["tenant_uid = $1", "user_uid = $2"];
        const values: unknown[] = [tenantUid, userUid];
        let paramIndex = 3;

        // Soft delete filter
        if (filter.status === "deleted") {
            conditions.push("is_deleted = 1");
        } else if (filter.status !== "all") {
            conditions.push("is_deleted = 0");
        }

        // Read status filter
        if (filter.readStatus === "unread") {
            conditions.push("is_read = 0");
        } else if (filter.readStatus === "read") {
            conditions.push("is_read = 1");
        }

        // Search in title or body
        if (filter.search && filter.search.trim()) {
            conditions.push(`(title ILIKE $${paramIndex} OR body ILIKE $${paramIndex})`);
            values.push(`%${filter.search.trim()}%`);
            paramIndex++;
        }

        const whereClause = conditions.join(" AND ");

        // Total count query
        const countQuery = `SELECT COUNT(*)::int AS total FROM notifications WHERE ${whereClause}`;
        const countResult = await this.pool.query(countQuery, values);
        const total = countResult.rows[0]?.total ?? 0;

        // Pagination query
        const page = filter.page && filter.page > 0 ? filter.page : 1;
        const limit = filter.limit && filter.limit > 0 ? filter.limit : 20;
        const offset = (page - 1) * limit;

        const dataQuery = `
            ${this.getBaseSelectQuery()}
            WHERE ${whereClause}
            ORDER BY created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        values.push(limit, offset);

        const dataResult = await this.pool.query(dataQuery, values);
        return { rows: dataResult.rows as INotification[], total };
    }

    /**
     * Counts unread, non-deleted notifications for a user.
     */
    async getUnreadCount(tenantUid: string, userUid: string): Promise<number> {
        const query = `
            SELECT COUNT(*)::int AS total
            FROM notifications
            WHERE tenant_uid = $1 AND user_uid = $2 AND is_read = 0 AND is_deleted = 0
        `;
        const result = await this.pool.query(query, [tenantUid, userUid]);
        return result.rows[0]?.total ?? 0;
    }

    /**
     * Finds a single notification by UID.
     */
    async getByUid(tenantUid: string, userUid: string, uid: string): Promise<INotification | null> {
        const query = `
            ${this.getBaseSelectQuery()}
            WHERE tenant_uid = $1 AND user_uid = $2 AND uid = $3
        `;
        const result = await this.pool.query(query, [tenantUid, userUid, uid]);
        return (result.rows[0] as INotification) ?? null;
    }

    /**
     * Marks a single notification as read.
     */
    async markAsRead(tenantUid: string, userUid: string, uid: string): Promise<INotification | null> {
        const query = `
            UPDATE notifications
            SET
                is_read = 1,
                read_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE tenant_uid = $1 AND user_uid = $2 AND uid = $3 AND is_deleted = 0
            RETURNING
                id, uid,
                tenant_uid AS "tenantUid",
                user_uid AS "userUid",
                title, body, module,
                reference_uid AS "referenceUid",
                template, data,
                is_read AS "isRead",
                read_at AS "readAt",
                is_active AS "isActive",
                is_deleted AS "isDeleted",
                created_at AS "createdAt",
                updated_at AS "updatedAt",
                deleted_at AS "deletedAt",
                created_by AS "createdBy",
                updated_by AS "updatedBy",
                deleted_by AS "deletedBy"
        `;
        const result = await this.pool.query(query, [tenantUid, userUid, uid]);
        return (result.rows[0] as INotification) ?? null;
    }

    /**
     * Marks all unread notifications for a user as read.
     */
    async markAllAsRead(tenantUid: string, userUid: string): Promise<number> {
        const query = `
            UPDATE notifications
            SET
                is_read = 1,
                read_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE tenant_uid = $1 AND user_uid = $2 AND is_read = 0 AND is_deleted = 0
        `;
        const result = await this.pool.query(query, [tenantUid, userUid]);
        return result.rowCount ?? 0;
    }

    /**
     * Soft deletes a notification.
     */
    async softDelete(tenantUid: string, userUid: string, uid: string, deletedBy: string): Promise<boolean> {
        const query = `
            UPDATE notifications
            SET
                is_deleted = 1,
                deleted_at = CURRENT_TIMESTAMP,
                deleted_by = $4,
                updated_at = CURRENT_TIMESTAMP
            WHERE tenant_uid = $1 AND user_uid = $2 AND uid = $3 AND is_deleted = 0
        `;
        const result = await this.pool.query(query, [tenantUid, userUid, uid, deletedBy]);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Restores a soft-deleted notification.
     */
    async restore(tenantUid: string, userUid: string, uid: string): Promise<boolean> {
        const query = `
            UPDATE notifications
            SET
                is_deleted = 0,
                deleted_at = NULL,
                deleted_by = NULL,
                updated_at = CURRENT_TIMESTAMP
            WHERE tenant_uid = $1 AND user_uid = $2 AND uid = $3 AND is_deleted = 1
        `;
        const result = await this.pool.query(query, [tenantUid, userUid, uid]);
        return (result.rowCount ?? 0) > 0;
    }
}

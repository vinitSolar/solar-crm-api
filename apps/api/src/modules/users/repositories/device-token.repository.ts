import type { Pool } from "pg";
import { v4 as uuidv4 } from "uuid";

export interface IUserDeviceToken {
    id: string;
    uid: string;
    tenantUid: string;
    userUid: string;
    deviceToken: string;
    deviceType: "android" | "ios";
    deviceName?: string | null;
    isActive: number;
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string | null;
    updatedBy?: string | null;
}

export interface IRegisterDeviceTokenInput {
    deviceToken: string;
    deviceType: "android" | "ios";
    deviceName?: string | null;
}

export class DeviceTokenRepository {
    private readonly pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    /**
     * Upserts a device token for a user.
     * If the token already exists (e.g. user re-logged in, or different user on same device),
     * updates the ownership to the current user and marks it active.
     */
    async upsertToken(
        tenantUid: string,
        userUid: string,
        data: IRegisterDeviceTokenInput,
        createdBy: string
    ): Promise<IUserDeviceToken> {
        const uid = uuidv4();
        const query = `
            INSERT INTO user_device_tokens (
                uid, tenant_uid, user_uid, device_token, device_type, device_name, is_active, created_by, updated_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, 1, $7, $7)
            ON CONFLICT (device_token) 
            DO UPDATE SET 
                tenant_uid = EXCLUDED.tenant_uid,
                user_uid = EXCLUDED.user_uid,
                device_type = EXCLUDED.device_type,
                device_name = EXCLUDED.device_name,
                is_active = 1,
                updated_at = CURRENT_TIMESTAMP,
                updated_by = EXCLUDED.updated_by
            RETURNING 
                id, uid, tenant_uid AS "tenantUid", user_uid AS "userUid",
                device_token AS "deviceToken", device_type AS "deviceType",
                device_name AS "deviceName", is_active AS "isActive",
                created_at AS "createdAt", updated_at AS "updatedAt"
        `;

        const values = [
            uid,
            tenantUid,
            userUid,
            data.deviceToken.trim(),
            data.deviceType,
            data.deviceName || null,
            createdBy
        ];

        const result = await this.pool.query(query, values);
        return result.rows[0] as IUserDeviceToken;
    }

    /**
     * Deactivates a specific device token (e.g. on logout).
     */
    async deactivateToken(tenantUid: string, userUid: string, deviceToken: string): Promise<boolean> {
        const query = `
            UPDATE user_device_tokens
            SET is_active = 0, updated_at = CURRENT_TIMESTAMP
            WHERE tenant_uid = $1 AND user_uid = $2 AND device_token = $3
        `;
        const result = await this.pool.query(query, [tenantUid, userUid, deviceToken.trim()]);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Deactivates a device token by token string only (used during logout).
     */
    async deactivateByToken(deviceToken: string): Promise<boolean> {
        const query = `
            UPDATE user_device_tokens
            SET is_active = 0, updated_at = CURRENT_TIMESTAMP
            WHERE device_token = $1
        `;
        const result = await this.pool.query(query, [deviceToken.trim()]);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Deactivates all active device tokens for a specific user (used during logout).
     */
    async deactivateAllByUser(userUid: string): Promise<number> {
        const query = `
            UPDATE user_device_tokens
            SET is_active = 0, updated_at = CURRENT_TIMESTAMP
            WHERE user_uid = $1 AND is_active = 1
        `;
        const result = await this.pool.query(query, [userUid]);
        return result.rowCount ?? 0;
    }

    /**
     * Retrieves all active mobile device tokens (Android / iOS) for a specific user.
     * Ensures the user is active, not deleted, and has an active token.
     */
    async getActiveTokensByUser(tenantUid?: string, userUid?: string): Promise<IUserDeviceToken[]> {
        if (!userUid) return [];

        let query: string;
        let values: unknown[];

        if (tenantUid) {
            query = `
                SELECT 
                    t.id, t.uid, t.tenant_uid AS "tenantUid", t.user_uid AS "userUid",
                    t.device_token AS "deviceToken", t.device_type AS "deviceType",
                    t.device_name AS "deviceName", t.is_active AS "isActive",
                    t.created_at AS "createdAt", t.updated_at AS "updatedAt"
                FROM user_device_tokens t
                INNER JOIN users u ON u.uid = t.user_uid
                WHERE t.tenant_uid = $1 AND t.user_uid = $2 AND t.is_active = 1
                  AND u.is_active = 1 AND u.is_deleted = 0
                  AND t.device_type IN ('android', 'ios')
            `;
            values = [tenantUid, userUid];
        } else {
            query = `
                SELECT 
                    t.id, t.uid, t.tenant_uid AS "tenantUid", t.user_uid AS "userUid",
                    t.device_token AS "deviceToken", t.device_type AS "deviceType",
                    t.device_name AS "deviceName", t.is_active AS "isActive",
                    t.created_at AS "createdAt", t.updated_at AS "updatedAt"
                FROM user_device_tokens t
                INNER JOIN users u ON u.uid = t.user_uid
                WHERE t.user_uid = $1 AND t.is_active = 1
                  AND u.is_active = 1 AND u.is_deleted = 0
                  AND t.device_type IN ('android', 'ios')
            `;
            values = [userUid];
        }

        const result = await this.pool.query(query, values);
        return result.rows as IUserDeviceToken[];
    }

    /**
     * Bulk deactivates stale/invalid registration tokens reported by FCM.
     */
    async deactivateInvalidTokens(deviceTokens: string[]): Promise<void> {
        if (!deviceTokens || deviceTokens.length === 0) return;
        const query = `
            UPDATE user_device_tokens
            SET is_active = 0, updated_at = CURRENT_TIMESTAMP
            WHERE device_token = ANY($1::text[])
        `;
        await this.pool.query(query, [deviceTokens]);
    }
}

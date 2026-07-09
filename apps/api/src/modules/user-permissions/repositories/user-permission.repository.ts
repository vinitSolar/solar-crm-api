import type { Pool } from "pg";
import type {
    IUserMenuPermissionSafe,
    IUpsertUserMenuPermission,
} from "../interfaces/user-permission.interface.js";
import { logger } from "@packages/logger/index.js";

export class UserPermissionRepository {
    constructor(private readonly pool: Pool) {}

    /**
     * Gets all menu permissions explicitly overridden for a user.
     * Joins with the `menus` table to include menu metadata.
     *
     * @param tenantUid The tenant UID
     * @param userUid The user UID
     * @returns Array of safe user menu permission objects
     */
    async getMenuPermissions(tenantUid: string, userUid: string): Promise<IUserMenuPermissionSafe[]> {
        const query = `
            SELECT 
                ump.menu_uid,
                m.name AS menu_name,
                m.code AS menu_code,
                ump.can_view,
                ump.can_create,
                ump.can_edit,
                ump.can_delete
            FROM user_menu_permissions ump
            JOIN menus m ON ump.menu_uid = m.uid
            WHERE ump.tenant_uid = $1 AND ump.user_uid = $2
            ORDER BY m.sort_order ASC
        `;

        const result = await this.pool.query(query, [tenantUid, userUid]);

        return result.rows.map((row) => ({
            menuUid: row.menu_uid,
            menuName: row.menu_name,
            menuCode: row.menu_code,
            canView: row.can_view,
            canCreate: row.can_create,
            canEdit: row.can_edit,
            canDelete: row.can_delete,
        }));
    }

    /**
     * Bulk upserts menu permissions for a user.
     * Replaces ALL existing permissions for the given user atomically.
     *
     * @param tenantUid The tenant UID
     * @param userUid The user UID
     * @param permissions Array of permissions to insert
     */
    async upsertMenuPermissions(
        tenantUid: string,
        userUid: string,
        permissions: IUpsertUserMenuPermission[]
    ): Promise<void> {
        const client = await this.pool.connect();

        try {
            await client.query("BEGIN");

            // 1. Delete existing user permissions for this user
            await client.query(
                `DELETE FROM user_menu_permissions WHERE tenant_uid = $1 AND user_uid = $2`,
                [tenantUid, userUid]
            );

            // 2. Insert new permissions (if any)
            if (permissions.length > 0) {
                const insertQuery = `
                    INSERT INTO user_menu_permissions 
                    (tenant_uid, user_uid, menu_uid, can_view, can_create, can_edit, can_delete)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                `;

                for (const perm of permissions) {
                    await client.query(insertQuery, [
                        tenantUid,
                        userUid,
                        perm.menuUid,
                        perm.canView,
                        perm.canCreate,
                        perm.canEdit,
                        perm.canDelete,
                    ]);
                }
            }

            await client.query("COMMIT");
        } catch (error) {
            await client.query("ROLLBACK");
            logger.error("UserPermissionRepository.upsertMenuPermissions failed", { tenantUid, userUid, error });
            throw error;
        } finally {
            client.release();
        }
    }
}

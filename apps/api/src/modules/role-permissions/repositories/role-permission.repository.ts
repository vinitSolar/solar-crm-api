import type { Pool } from "pg";
import type { IUpsertRoleMenuPermission } from "../interfaces/role-permission.interface.js";
import { logger } from "@packages/logger/index.js";

/**
 * Role Permission Repository.
 * Contains ONLY SQL queries — no business logic.
 */
export class RolePermissionRepository {
    private readonly pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    /**
     * Get all menu permissions for a role, joined with menu metadata.
     */
    async getMenuPermissionsByRole(
        roleUid: string,
        tenantUid: string,
    ): Promise<any[]> {
        logger.debug("RolePermissionRepository.getMenuPermissionsByRole", {
            roleUid,
            tenantUid,
        });

        const query = `
            SELECT 
                m.uid AS menu_uid,
                m.name AS menu_name,
                m.code AS menu_code,
                COALESCE(rmp.can_view, 0) AS can_view,
                COALESCE(rmp.can_create, 0) AS can_create,
                COALESCE(rmp.can_edit, 0) AS can_edit,
                COALESCE(rmp.can_delete, 0) AS can_delete
            FROM menus m
            LEFT JOIN role_menu_permissions rmp
                ON m.uid = rmp.menu_uid
                AND rmp.role_uid = $1
                AND rmp.tenant_uid = $2
            WHERE m.is_active = 1 AND m.deleted_at IS NULL
            ORDER BY m.sort_order ASC NULLS LAST, m.name ASC
        `;

        const result = await this.pool.query(query, [roleUid, tenantUid]);
        return result.rows;
    }

    /**
     * Bulk upsert menu permissions for a role.
     * Deletes existing permissions and inserts new ones in a transaction.
     */
    async upsertMenuPermissions(
        roleUid: string,
        tenantUid: string,
        permissions: IUpsertRoleMenuPermission[],
    ): Promise<void> {
        logger.debug("RolePermissionRepository.upsertMenuPermissions", {
            roleUid,
            tenantUid,
            count: permissions.length,
        });

        const client = await this.pool.connect();

        try {
            await client.query("BEGIN");

            // Delete existing permissions for this role + tenant
            await client.query(
                `DELETE FROM role_menu_permissions 
                 WHERE role_uid = $1 AND tenant_uid = $2`,
                [roleUid, tenantUid],
            );

            // Insert new permissions
            if (permissions.length > 0) {
                const values: any[] = [];
                const placeholders: string[] = [];
                let index = 1;

                for (const perm of permissions) {
                    placeholders.push(
                        `($${index++}, $${index++}, $${index++}, $${index++}, $${index++}, $${index++}, $${index++})`,
                    );
                    values.push(
                        tenantUid,
                        roleUid,
                        perm.menuUid,
                        perm.canView,
                        perm.canCreate,
                        perm.canEdit,
                        perm.canDelete,
                    );
                }

                const insertQuery = `
                    INSERT INTO role_menu_permissions 
                        (tenant_uid, role_uid, menu_uid, can_view, can_create, can_edit, can_delete)
                    VALUES ${placeholders.join(", ")}
                `;

                await client.query(insertQuery, values);
            }

            await client.query("COMMIT");
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }
}

import type { Pool, PoolClient } from "pg";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../../logger/index.js";
import {
    DEFAULT_FRANCHISE_ROLES,
    getDefaultPermissionForFranchiseRole,
} from "../../../apps/api/src/modules/franchises/constants/franchise-role-permissions.constants.js";

type Queryable = Pool | PoolClient;

/**
 * Seeds default roles and their corresponding menu permissions for a given tenant.
 *
 * For Head Office (tenantType = 0):
 *   Seeds operational roles (Sales Executive, Survey Engineer, Backoffice, Warehouse / Procurement, Installer).
 *   (Master role is the Super Admin and handled separately).
 *
 * For Franchise (tenantType = 1):
 *   Seeds all franchise roles (Franchise Owner(Admin), Sales Executive, Survey Engineer, Backoffice, Warehouse / Procurement, Installer).
 *
 * Menu permissions are assigned automatically based on getDefaultPermissionForFranchiseRole.
 */
export async function seedDefaultRoles(
    client: Queryable,
    tenantUid: string,
    tenantType: number,
    createdBy: string = "SYSTEM"
): Promise<{ created: number; skipped: number }> {
    logger.info(`🌱 Seeding default roles for tenant: ${tenantUid} (type: ${tenantType})...`);

    // 1. Fetch active menus
    const menusResult = await client.query(
        "SELECT uid, code FROM menus WHERE is_active = 1 ORDER BY sort_order ASC NULLS LAST"
    );
    const activeMenus = menusResult.rows;

    if (activeMenus.length === 0) {
        logger.warn("No active menus found in database while seeding default roles.");
        return { created: 0, skipped: 0 };
    }

    // 2. Determine roles to seed
    const roleDefs = tenantType === 0
        ? DEFAULT_FRANCHISE_ROLES.filter((r) => r.name !== "Franchise Owner(Admin)")
        : DEFAULT_FRANCHISE_ROLES;

    let createdCount = 0;
    let skippedCount = 0;

    for (const roleDef of roleDefs) {
        // Check if role already exists with the same name for this tenant (case-insensitive)
        const existingRoleResult = await client.query(
            "SELECT uid, name FROM roles WHERE tenant_uid = $1 AND LOWER(TRIM(name)) = LOWER(TRIM($2)) AND is_deleted = 0 LIMIT 1",
            [tenantUid, roleDef.name]
        );

        if (existingRoleResult.rows.length > 0) {
            skippedCount++;
            logger.info(`ℹ️ Role '${roleDef.name}' already exists for tenant ${tenantUid}. Skipping.`);
            continue;
        }

        const roleUid = uuidv4();
        await client.query(
            `INSERT INTO roles (
                uid, tenant_uid, name, description, can_site_survey, can_installation, can_sale, show_all_leads, show_all_surveys, is_system, is_active, is_deleted, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, 1, 0, $10)`,
            [
                roleUid,
                tenantUid,
                roleDef.name,
                roleDef.description,
                roleDef.canSiteSurvey ?? 0,
                roleDef.canInstallation ?? 0,
                roleDef.canSale ?? 0,
                roleDef.showAllLeads ?? 0,
                roleDef.showAllSurveys ?? 0,
                createdBy,
            ]
        );
        createdCount++;
        logger.info(`✅ Created default role '${roleDef.name}' (${roleUid}) for tenant ${tenantUid}`);

        // 3. Assign default menu permissions for this new role
        for (const menu of activeMenus) {
            const perm = getDefaultPermissionForFranchiseRole(roleDef.name, menu.code);

            await client.query(
                `INSERT INTO role_menu_permissions (tenant_uid, role_uid, menu_uid, can_view, can_create, can_edit, can_delete, can_setting)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [tenantUid, roleUid, menu.uid, perm.canView, perm.canCreate, perm.canEdit, perm.canDelete, perm.canSetting]
            );
        }
    }

    logger.info(`🎉 Completed role & permission seeding for tenant ${tenantUid} (Created: ${createdCount}, Skipped: ${skippedCount})`);
    return { created: createdCount, skipped: skippedCount };
}

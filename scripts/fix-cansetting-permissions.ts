import 'dotenv/config';
import pool from "../packages/connection.js";

async function run() {
    try {
        console.log("Fixing can_setting permissions for Head Office and Franchises...");
        
        await pool.query("BEGIN");

        // 1. Head Office Updates (tenant code = 'HO')
        console.log("Updating Head Office permissions...");
        
        const headOfficeNoSettingMenus = [
            'DASHBOARD', 'LEADS', 'SURVEYS', 'QUOTATIONS', 'projects', 'PAYMENTS', 'subsidy_tracker'
        ];

        // Set can_setting = 0 for specific menus for HO
        await pool.query(`
            UPDATE role_menu_permissions 
            SET can_setting = 0
            FROM menus m, tenants t
            WHERE role_menu_permissions.menu_uid = m.uid
              AND role_menu_permissions.tenant_uid = t.uid
              AND m.code = ANY($1)
              AND t.code = 'HO';
        `, [headOfficeNoSettingMenus]);

        await pool.query(`
            UPDATE user_menu_permissions 
            SET can_setting = 0
            FROM menus m, tenants t
            WHERE user_menu_permissions.menu_uid = m.uid
              AND user_menu_permissions.tenant_uid = t.uid
              AND m.code = ANY($1)
              AND t.code = 'HO';
        `, [headOfficeNoSettingMenus]);

        // Set can_setting = 1 for all OTHER menus for HO
        await pool.query(`
            UPDATE role_menu_permissions 
            SET can_setting = 1
            FROM menus m, tenants t
            WHERE role_menu_permissions.menu_uid = m.uid
              AND role_menu_permissions.tenant_uid = t.uid
              AND NOT (m.code = ANY($1))
              AND t.code = 'HO';
        `, [headOfficeNoSettingMenus]);

        await pool.query(`
            UPDATE user_menu_permissions 
            SET can_setting = 1
            FROM menus m, tenants t
            WHERE user_menu_permissions.menu_uid = m.uid
              AND user_menu_permissions.tenant_uid = t.uid
              AND NOT (m.code = ANY($1))
              AND t.code = 'HO';
        `, [headOfficeNoSettingMenus]);


        // 2. Franchise Updates (tenant code != 'HO')
        console.log("Updating Franchise permissions...");
        
        const franchiseYesSettingMenus = ['USERS', 'ROLES'];

        // Set can_setting = 1 for USERS and ROLES for Franchises
        await pool.query(`
            UPDATE role_menu_permissions 
            SET can_setting = 1
            FROM menus m, tenants t
            WHERE role_menu_permissions.menu_uid = m.uid
              AND role_menu_permissions.tenant_uid = t.uid
              AND m.code = ANY($1)
              AND t.code != 'HO';
        `, [franchiseYesSettingMenus]);

        await pool.query(`
            UPDATE user_menu_permissions 
            SET can_setting = 1
            FROM menus m, tenants t
            WHERE user_menu_permissions.menu_uid = m.uid
              AND user_menu_permissions.tenant_uid = t.uid
              AND m.code = ANY($1)
              AND t.code != 'HO';
        `, [franchiseYesSettingMenus]);

        // Set can_setting = 0 for all OTHER menus for Franchises
        await pool.query(`
            UPDATE role_menu_permissions 
            SET can_setting = 0
            FROM menus m, tenants t
            WHERE role_menu_permissions.menu_uid = m.uid
              AND role_menu_permissions.tenant_uid = t.uid
              AND NOT (m.code = ANY($1))
              AND t.code != 'HO';
        `, [franchiseYesSettingMenus]);

        await pool.query(`
            UPDATE user_menu_permissions 
            SET can_setting = 0
            FROM menus m, tenants t
            WHERE user_menu_permissions.menu_uid = m.uid
              AND user_menu_permissions.tenant_uid = t.uid
              AND NOT (m.code = ANY($1))
              AND t.code != 'HO';
        `, [franchiseYesSettingMenus]);

        await pool.query("COMMIT");
        console.log("Permissions fixed successfully.");
        process.exit(0);
    } catch (error) {
        await pool.query("ROLLBACK");
        console.error("Error fixing permissions:", error);
        process.exit(1);
    }
}

run();

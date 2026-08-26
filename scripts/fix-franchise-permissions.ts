import 'dotenv/config';
import pool from "../packages/connection.js";

async function run() {
    try {
        console.log("Fixing franchise permissions for installation_milestones and packages...");
        
        await pool.query(`
            UPDATE role_menu_permissions 
            SET can_create = 0, can_edit = 0, can_delete = 0, can_setting = 1
            FROM menus m, tenants t
            WHERE role_menu_permissions.menu_uid = m.uid
              AND role_menu_permissions.tenant_uid = t.uid
              AND m.code IN ('installation_milestones', 'packages')
              AND t.code != 'HO';
        `);

        await pool.query(`
            UPDATE user_menu_permissions 
            SET can_create = 0, can_edit = 0, can_delete = 0, can_setting = 1
            FROM menus m, tenants t
            WHERE user_menu_permissions.menu_uid = m.uid
              AND user_menu_permissions.tenant_uid = t.uid
              AND m.code IN ('installation_milestones', 'packages')
              AND t.code != 'HO';
        `);

        console.log("Permissions fixed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Error fixing permissions:", error);
        process.exit(1);
    }
}

run();

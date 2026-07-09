import pool from "@packages/connection.js";

async function run() {
    try {
        const roleUid = "eab3fbaf-1937-4fbc-9921-392b84780dc1";
        const tenantUid = "0b22c4d2-568a-4c67-a332-85bdd87d9575";
        
        // Find a user with this role
        const userRes = await pool.query("SELECT * FROM users WHERE role_uid = $1 LIMIT 1", [roleUid]);
        if (userRes.rows.length === 0) {
            console.log("No user found for this role");
            return;
        }
        const userUid = userRes.rows[0].uid;
        console.log("Found user:", userRes.rows[0].email);

        const menusQuery = `
            SELECT 
                m.uid AS menu_uid,
                m.name,
                m.code,
                m.route,
                COALESCE(ump.can_view, rmp.can_view, 0) AS can_view,
                COALESCE(ump.can_create, rmp.can_create, 0) AS can_create,
                COALESCE(ump.can_edit, rmp.can_edit, 0) AS can_edit,
                COALESCE(ump.can_delete, rmp.can_delete, 0) AS can_delete
            FROM menus m
            LEFT JOIN role_menu_permissions rmp 
                ON m.uid = rmp.menu_uid AND rmp.role_uid = $1 AND rmp.tenant_uid = $3
            LEFT JOIN user_menu_permissions ump 
                ON m.uid = ump.menu_uid AND ump.user_uid = $2 AND ump.tenant_uid = $3
            WHERE m.is_active = 1 AND m.deleted_at IS NULL
            ORDER BY m.sort_order ASC
        `;

        const res = await pool.query(menusQuery, [roleUid, userUid, tenantUid]);
        console.log("AuthRepository Permissions output:");
        console.log(JSON.stringify(res.rows, null, 2));

        const rpQuery = `
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
        const rpRes = await pool.query(rpQuery, [roleUid, tenantUid]);
        console.log("\nRolePermissionRepository output:");
        console.log(JSON.stringify(rpRes.rows, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
run();

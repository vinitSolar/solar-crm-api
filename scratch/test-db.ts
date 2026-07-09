import pool from "@packages/connection.js";

async function run() {
    try {
        const res = await pool.query("SELECT * FROM role_menu_permissions ORDER BY id DESC LIMIT 5");
        console.log("role_menu_permissions:", JSON.stringify(res.rows, null, 2));

        const roleRes = await pool.query("SELECT * FROM roles WHERE name = 'Franchise Owner(Admin)' ORDER BY created_at DESC LIMIT 1");
        console.log("admin role:", JSON.stringify(roleRes.rows, null, 2));

        if (roleRes.rows.length > 0) {
            const roleUid = roleRes.rows[0].uid;
            const permRes = await pool.query("SELECT * FROM role_menu_permissions WHERE role_uid = $1", [roleUid]);
            console.log(`permissions for role ${roleUid}:`, JSON.stringify(permRes.rows, null, 2));
        }

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
run();

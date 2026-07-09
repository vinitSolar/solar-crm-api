import "dotenv/config";
import pool from "@packages/connection.js";

async function run() {
    try {
        const rolesQuery = await pool.query("SELECT DISTINCT role_uid, tenant_uid FROM users WHERE role_uid != 'eab3fbaf-1937-4fbc-9921-392b84780dc1'");
        const sourcePermissions = await pool.query("SELECT * FROM role_menu_permissions WHERE role_uid = 'eab3fbaf-1937-4fbc-9921-392b84780dc1'");
        
        for (const role of rolesQuery.rows) {
            for (const perm of sourcePermissions.rows) {
                await pool.query(`
                    INSERT INTO role_menu_permissions 
                    (tenant_uid, role_uid, menu_uid, can_view, can_create, can_edit, can_delete)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    ON CONFLICT DO NOTHING
                `, [role.tenant_uid, role.role_uid, perm.menu_uid, perm.can_view, perm.can_create, perm.can_edit, perm.can_delete]);
            }
            console.log("Copied permissions to role", role.role_uid);
        }
        console.log("Done copying permissions.");
        
        const AuthRepository = (await import("../apps/api/src/modules/auth/repositories/auth.repository.js")).AuthRepository;
        const repo = new AuthRepository(pool);
        
        const allUsersRes = await pool.query("SELECT email, uid, role_uid, tenant_uid FROM users");
        for (const u of allUsersRes.rows) {
            const result = await repo.getPermissions(u.uid, u.role_uid, u.tenant_uid);
            const surveysPerm = result.menus.find((m: any) => m.name === "Surveys");
            console.log(`User: ${u.email}, Surveys canCreate:`, surveysPerm?.canCreate);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
run();

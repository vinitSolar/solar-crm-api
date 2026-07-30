import bcrypt from "bcrypt";
import { Pool } from "pg";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../../logger/index.js";
import { seedProductSpecifications } from "./seed_product_specifications.js";
import { seedTenantDefaults } from "./seed_tenant_defaults.js";

const SALT_ROUNDS = 10;

export async function seed(pool: Pool) {
    const client = await pool.connect();

    try {
        // 1. Seed Default Menus
        const menusCheck = await client.query("SELECT COUNT(*) FROM menus");
        if (parseInt(menusCheck.rows[0].count) === 0) {
            logger.info("🌱 Seeding default menus...");
            await client.query("BEGIN");
            const defaultMenus = [
                { name: "Dashboard", code: "DASHBOARD", route: "/dashboard", icon: "LayoutDashboard", sortOrder: 1 },
                { name: "Leads", code: "LEADS", route: "/leads", icon: "Users", sortOrder: 2 },
                { name: "Surveys", code: "SURVEYS", route: "/surveys", icon: "ClipboardList", sortOrder: 3 },
                { name: "Quotations", code: "QUOTATIONS", route: "/quotations", icon: "FileText", sortOrder: 4 },
                { name: "Cell Technologies", code: "CELL_TECHNOLOGIES", route: "/cell-technologies", icon: "Cpu", sortOrder: 5 },
            ];

            for (const menu of defaultMenus) {
                await client.query(
                    `INSERT INTO menus (uid, name, code, route, icon, sort_order, is_active)
                     VALUES ($1, $2, $3, $4, $5, $6, 1)
                     ON CONFLICT (code) DO NOTHING`,
                    [uuidv4(), menu.name, menu.code, menu.route, menu.icon, menu.sortOrder]
                );
            }
            await client.query("COMMIT");
            logger.info(`✅ Default menus seeded: ${defaultMenus.map(m => m.name).join(", ")}`);
        }

        // Seed Product Categories
        const categoriesCheck = await client.query("SELECT COUNT(*) FROM product_categories");
        if (parseInt(categoriesCheck.rows[0].count) === 0) {
            logger.info("🌱 Seeding product categories...");
            await client.query("BEGIN");
            const defaultCategories = [
                { name: "Solar Panels", description: "Photovoltaic solar panels", sortOrder: 1, isDynamic: 0 },
                { name: "Inverters", description: "Solar inverters", sortOrder: 2, isDynamic: 0 },
                { name: "Batteries", description: "Energy storage batteries", sortOrder: 3, isDynamic: 0 },
                { name: "Mounting Structures", description: "Structures for mounting solar panels", sortOrder: 4, isDynamic: 0 },
                { name: "Cables & Wires", description: "Electrical cables and wires", sortOrder: 5, isDynamic: 0 },
                { name: "Accessories", description: "Other solar accessories", sortOrder: 6, isDynamic: 0 },
            ];

            for (const category of defaultCategories) {
                await client.query(
                    `INSERT INTO product_categories (uid, name, description, sort_order, is_active, is_dynamic)
                     VALUES ($1, $2, $3, $4, 1, $5)
                     ON CONFLICT (name) DO NOTHING`,
                    [uuidv4(), category.name, category.description, category.sortOrder, category.isDynamic]
                );
            }
            await client.query("COMMIT");
            logger.info(`✅ Product categories seeded: ${defaultCategories.map(c => c.name).join(", ")}`);
        }

        // Seed Product Units
        const unitsCheck = await client.query("SELECT COUNT(*) FROM product_units");
        if (parseInt(unitsCheck.rows[0].count) === 0) {
            logger.info("🌱 Seeding product units...");
            await client.query("BEGIN");
            const defaultUnits = [
                { name: "Pieces", shortName: "pcs", description: "Individual pieces", sortOrder: 1 },
                { name: "Watts", shortName: "W", description: "Power in Watts", sortOrder: 2 },
                { name: "Kilowatts", shortName: "kW", description: "Power in Kilowatts", sortOrder: 3 },
                { name: "Meters", shortName: "m", description: "Length in meters", sortOrder: 4 },
                { name: "Rolls", shortName: "roll", description: "Items in rolls", sortOrder: 5 },
                { name: "Sets", shortName: "set", description: "Items in sets", sortOrder: 6 },
            ];

            for (const unit of defaultUnits) {
                await client.query(
                    `INSERT INTO product_units (uid, name, short_name, description, sort_order, is_active)
                     VALUES ($1, $2, $3, $4, $5, 1)
                     ON CONFLICT (name) DO NOTHING`,
                    [uuidv4(), unit.name, unit.shortName, unit.description, unit.sortOrder]
                );
            }
            await client.query("COMMIT");
            logger.info(`✅ Product units seeded: ${defaultUnits.map(u => u.name).join(", ")}`);
        }



        // Run independent seeders
        await seedProductSpecifications(pool);

        // Check if admin user already exists to avoid unnecessary hashing
        const checkRes = await client.query("SELECT uid, tenant_uid, role_uid FROM users WHERE email = $1", ["admin@sunselect.com"]);
        
        let tenantUid = "";
        let roleUid = "";
        let userUid = "";

        await client.query("BEGIN");

        if (checkRes.rowCount && checkRes.rowCount > 0) {
            logger.info("🎉 Database already seeded with admin user. Syncing new menu permissions...");
            userUid = checkRes.rows[0].uid;
            tenantUid = checkRes.rows[0].tenant_uid;
            roleUid = checkRes.rows[0].role_uid;
        } else {
            logger.info("🌱 Starting admin user seed...");
            const password = "Admin@123";
            const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

            tenantUid = uuidv4();
            roleUid = uuidv4();
            userUid = uuidv4();

            // 2. Tenant: Head Office
            await client.query(
                `INSERT INTO tenants (uid, code, name, type, email, timezone, is_active, is_deleted, created_by)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 ON CONFLICT (code) DO NOTHING`,
                [
                    tenantUid,
                    "HO",
                    "SunSelect Solar India",
                    0,
                    "admin@sunselect.com",
                    "Asia/Kolkata",
                    1,
                    0,
                    "SYSTEM",
                ]
            );
            logger.info(`✅ Tenant: SunSelect Solar India (Head Office) — ${tenantUid}`);

            // 3. Role: Master
            await client.query(
                `INSERT INTO roles (uid, tenant_uid, name, description, is_system, is_active, is_deleted, created_by)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 ON CONFLICT (uid) DO NOTHING`,
                [
                    roleUid,
                    tenantUid,
                    "Master",
                    "Super administrator role with full system access. This is a system-defined role and cannot be modified or deleted.",
                    1,
                    1,
                    0,
                    "SYSTEM",
                ]
            );
            logger.info(`✅ Role: Master (System Role) — ${roleUid}`);

            // 4. User: Admin
            await client.query(
                `INSERT INTO users (uid, tenant_uid, role_uid, first_name, last_name, email, password, is_active, is_deleted, created_by)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                 ON CONFLICT (email) DO NOTHING`,
                [
                    userUid,
                    tenantUid,
                    roleUid,
                    "Admin",
                    "User",
                    "admin@sunselect.com",
                    hashedPassword,
                    1,
                    0,
                    "SYSTEM",
                ]
            );
            logger.info(`✅ User: admin@sunselect.com (Admin@123) — ${userUid}`);
        }

        // 5. Grant full access to Master role
        const allMenusRes = await client.query("SELECT uid FROM menus");
        for (const menuRow of allMenusRes.rows) {
            // Update if exists
            await client.query(
                `UPDATE role_menu_permissions 
                 SET can_view = 1, can_create = 1, can_edit = 1, can_delete = 1 
                 WHERE role_uid = $1 AND menu_uid = $2`,
                [roleUid, menuRow.uid]
            );
            // Insert if not exists
            await client.query(
                `INSERT INTO role_menu_permissions (tenant_uid, role_uid, menu_uid, can_view, can_create, can_edit, can_delete)
                 SELECT $1::varchar, $2::varchar, $3::varchar, 1, 1, 1, 1
                 WHERE NOT EXISTS (
                     SELECT 1 FROM role_menu_permissions WHERE role_uid = $2 AND menu_uid = $3
                 )`,
                [tenantUid, roleUid, menuRow.uid]
            );
        }
        logger.info(`✅ Synced full menu access to Master role.`);

        // 6. Grant full user-specific access to Admin user
        for (const menuRow of allMenusRes.rows) {
            // Update if exists
            await client.query(
                `UPDATE user_menu_permissions 
                 SET can_view = 1, can_create = 1, can_edit = 1, can_delete = 1 
                 WHERE user_uid = $1 AND menu_uid = $2`,
                [userUid, menuRow.uid]
            );
            // Insert if not exists
            await client.query(
                `INSERT INTO user_menu_permissions (tenant_uid, user_uid, menu_uid, can_view, can_create, can_edit, can_delete)
                 SELECT $1::varchar, $2::varchar, $3::varchar, 1, 1, 1, 1
                 WHERE NOT EXISTS (
                     SELECT 1 FROM user_menu_permissions WHERE user_uid = $2 AND menu_uid = $3
                 )`,
                [tenantUid, userUid, menuRow.uid]
            );
        }
        logger.info(`✅ Synced full user-specific menu access to Admin user.`);

        // Seed default settings/document types for Head Office tenant
        await seedTenantDefaults(client, tenantUid);

        await client.query("COMMIT");

        logger.info("🎉 Database seed completed successfully!");

    } catch (error) {
        await client.query("ROLLBACK");
        logger.error("❌ Seed failed:", error);
        throw error;
    } finally {
        client.release();
    }
}

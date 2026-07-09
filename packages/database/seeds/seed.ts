import bcrypt from "bcrypt";
import { Pool } from "pg";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../../logger/index.js";

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
                { name: "Solar Panels", description: "Photovoltaic solar panels", sortOrder: 1 },
                { name: "Inverters", description: "Solar inverters", sortOrder: 2 },
                { name: "Batteries", description: "Energy storage batteries", sortOrder: 3 },
                { name: "Mounting Structures", description: "Structures for mounting solar panels", sortOrder: 4 },
                { name: "Cables & Wires", description: "Electrical cables and wires", sortOrder: 5 },
                { name: "Accessories", description: "Other solar accessories", sortOrder: 6 },
            ];

            for (const category of defaultCategories) {
                await client.query(
                    `INSERT INTO product_categories (uid, name, description, sort_order, is_active)
                     VALUES ($1, $2, $3, $4, 1)
                     ON CONFLICT (name) DO NOTHING`,
                    [uuidv4(), category.name, category.description, category.sortOrder]
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

        // Check if admin user already exists to avoid unnecessary hashing
        const checkRes = await client.query("SELECT 1 FROM users WHERE email = $1", ["admin@sunselect.com"]);
        if (checkRes.rowCount && checkRes.rowCount > 0) {
            logger.info("🎉 Database already seeded with admin user.");
            return;
        }

        const password = "Admin@123";
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        const tenantUid = uuidv4();
        const roleUid = uuidv4();
        const userUid = uuidv4();

        logger.info("🌱 Starting admin user seed...");

        await client.query("BEGIN");

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

        // 5. Grant full access to Master role
        const allMenusRes = await client.query("SELECT uid FROM menus");
        for (const menuRow of allMenusRes.rows) {
            await client.query(
                `INSERT INTO role_menu_permissions (tenant_uid, role_uid, menu_uid, can_view, can_create, can_edit, can_delete)
                 VALUES ($1, $2, $3, 1, 1, 1, 1)`,
                [tenantUid, roleUid, menuRow.uid]
            );
        }
        logger.info(`✅ Granted full menu access to Master role.`);

        // 6. Grant full user-specific access to Admin user
        for (const menuRow of allMenusRes.rows) {
            await client.query(
                `INSERT INTO user_menu_permissions (tenant_uid, user_uid, menu_uid, can_view, can_create, can_edit, can_delete)
                 VALUES ($1, $2, $3, 1, 1, 1, 1)`,
                [tenantUid, userUid, menuRow.uid]
            );
        }
        logger.info(`✅ Granted full user-specific menu access to Admin user.`);

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

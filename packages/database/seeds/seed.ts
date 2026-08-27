import bcrypt from "bcrypt";
import { Pool } from "pg";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../../logger/index.js";
import { seedProductSpecifications } from "./seed_product_specifications.js";
import { seedTenantDefaults } from "./seed_tenant_defaults.js";
import { seedProducts } from "./seed_products.js";

const SALT_ROUNDS = 10;

export async function seed(pool: Pool) {
    const client = await pool.connect();

    const defaultMenus = [
        { name: "Dashboard", code: "DASHBOARD", route: "/dashboard", icon: "LayoutDashboard", sortOrder: 1, permissions: { view: 1, create: 1, edit: 1, delete: 1, setting: 1 } },
        { name: "Leads", code: "LEADS", route: "/leads", icon: "Users", sortOrder: 10, permissions: { view: 1, create: 1, edit: 1, delete: 1, setting: 1 } },
        { name: "Site Surveys", code: "SURVEYS", route: "/surveys", icon: "ClipboardList", sortOrder: 20, permissions: { view: 1, create: 1, edit: 1, delete: 1, setting: 1 } },
        { name: "Quotations", code: "QUOTATIONS", route: "/quotations", icon: "FileText", sortOrder: 30, permissions: { view: 1, create: 1, edit: 1, delete: 1, setting: 1 } },
        { name: "Projects", code: "projects", route: "/projects", icon: "Briefcase", sortOrder: 40, permissions: { view: 1, create: 1, edit: 1, delete: 1, setting: 1 } },
        { name: "Payments", code: "PAYMENTS", route: "/payments", icon: "Banknote", sortOrder: 50, permissions: { view: 1, create: 1, edit: 1, delete: 1, setting: 1 } },
        { name: "Platform Settings", code: "PLATFORM_SETTINGS", route: "/platform-settings", icon: "Settings", sortOrder: 55, permissions: { view: 1, create: 1, edit: 1, delete: 1, setting: 1 } },
        { name: "Users", code: "USERS", route: "/settings/users", icon: "UsersRound", sortOrder: 60, permissions: { view: 1, create: 1, edit: 1, delete: 1, setting: 1 } },
        { name: "Roles", code: "ROLES", route: "/settings/roles", icon: "ShieldCheck", sortOrder: 70, permissions: { view: 1, create: 1, edit: 1, delete: 1, setting: 1 } },
        { name: "Franchises", code: "FRANCHISES", route: "/settings/franchises", icon: "Building2", sortOrder: 80, permissions: { view: 1, create: 1, edit: 1, delete: 1, setting: 1 } },
        { name: "Lead Sources", code: "LEAD_SOURCES", route: "/settings/lead-sources", icon: "Tag", sortOrder: 90, permissions: { view: 1, create: 1, edit: 1, delete: 1, setting: 1 } },
        { name: "Lead Statuses", code: "LEAD_STATUSES", route: "/settings/lead-statuses", icon: "CircleDot", sortOrder: 100, permissions: { view: 1, create: 1, edit: 1, delete: 1, setting: 1 } },
        { name: "Project Statuses", code: "PROJECT_STATUSES", route: "/settings/project-statuses", icon: "CircleDot", sortOrder: 110, permissions: { view: 1, create: 1, edit: 1, delete: 1, setting: 1 } },
        { name: "Product Masters", code: "PRODUCTS", route: "/settings/products", icon: "Boxes", sortOrder: 120, permissions: { view: 1, create: 1, edit: 1, delete: 1, setting: 1 } },
        { name: "Subsidy Masters", code: "SUBSIDIES", route: "/settings/subsidies", icon: "BadgeIndianRupee", sortOrder: 130, permissions: { view: 1, create: 1, edit: 1, delete: 1, setting: 1 } },
        { name: "Packages", code: "packages", route: "/settings/packages", icon: "PackageCheck", sortOrder: 140, permissions: { view: 1, create: 1, edit: 1, delete: 1, setting: 1 } },
        { name: "Quotation Masters", code: "QUOTATION_MASTERS", route: "/settings/quotation-masters", icon: "FileCheck2", sortOrder: 150, permissions: { view: 1, create: 1, edit: 1, delete: 1, setting: 1 } },
        { name: "Document Types", code: "DOCUMENT_TYPES", route: "/settings/document-types", icon: "FolderPlus", sortOrder: 160, permissions: { view: 1, create: 1, edit: 1, delete: 1, setting: 1 } },
        { name: "Installation Milestones", code: "installation_milestones", route: "/settings/installation-milestones", icon: "Milestone", sortOrder: 170, permissions: { view: 1, create: 1, edit: 1, delete: 1, setting: 1 } },
        { name: "Product Categories", code: "PRODUCT_CATEGORIES", route: "/settings/product-categories", icon: "ListTree", sortOrder: 180, permissions: { view: 1, create: 1, edit: 1, delete: 1, setting: 1 } },
        { name: "Product Specifications", code: "PRODUCT_SPECIFICATIONS", route: "/settings/product-specifications", icon: "Settings2", sortOrder: 190, permissions: { view: 1, create: 1, edit: 1, delete: 1, setting: 1 } },
        { name: "Product Brands", code: "PRODUCT_BRANDS", route: "/settings/product-brands", icon: "Tags", sortOrder: 200, permissions: { view: 1, create: 1, edit: 1, delete: 1, setting: 1 } },
        { name: "Product Units", code: "PRODUCT_UNITS", route: "/settings/product-units", icon: "Scale", sortOrder: 210, permissions: { view: 1, create: 1, edit: 1, delete: 1, setting: 1 } },
        { name: "State Subsidy Rules", code: "STATE_SUBSIDY_RULES", route: "/settings/state-subsidy-rules", icon: "Landmark", sortOrder: 220, permissions: { view: 1, create: 1, edit: 1, delete: 1, setting: 1 } },
        { name: "Quotation Terms", code: "QUOTATION_TERMS", route: "/settings/quotation-terms", icon: "ScrollText", sortOrder: 230, permissions: { view: 1, create: 1, edit: 1, delete: 1, setting: 1 } },
        { name: "Quotation Scope", code: "QUOTATION_SCOPE", route: "/settings/quotation-scope", icon: "ListChecks", sortOrder: 240, permissions: { view: 1, create: 1, edit: 1, delete: 1, setting: 1 } },
        { name: "Subsidy Document Types", code: "SUBSIDY_DOCUMENT_TYPES", route: "/subsidy-document-types", icon: "Files", sortOrder: 250, permissions: { view: 1, create: 1, edit: 1, delete: 1, setting: 1 } },
        { name: "Subsidy Trackers", code: "subsidy_tracker", route: "/subsidy-trackers", icon: "FileSpreadsheet", sortOrder: 270, permissions: { view: 1, create: 1, edit: 1, delete: 1, setting: 1 } },
        { name: "Bank Details", code: "BANK_DETAILS", route: "/settings/bank-details", icon: "Landmark", sortOrder: 280, permissions: { view: 1, create: 1, edit: 1, delete: 1, setting: 1 } },
    ];

    try {
        // 1. Seed Default Menus
        logger.info("🌱 Seeding default menus...");
        await client.query("BEGIN");

        // Clean up accidental duplicate uppercase menus
        await client.query(`
            DELETE FROM role_menu_permissions WHERE menu_uid IN (SELECT uid FROM menus WHERE code IN ('PROJECTS', 'SUBSIDIES_TRACKER', 'PACKAGES', 'INSTALLATION_MILESTONES'));
            DELETE FROM user_menu_permissions WHERE menu_uid IN (SELECT uid FROM menus WHERE code IN ('PROJECTS', 'SUBSIDIES_TRACKER', 'PACKAGES', 'INSTALLATION_MILESTONES'));
            DELETE FROM features WHERE menu_uid IN (SELECT uid FROM menus WHERE code IN ('PROJECTS', 'SUBSIDIES_TRACKER', 'PACKAGES', 'INSTALLATION_MILESTONES'));
            DELETE FROM menus WHERE code IN ('PROJECTS', 'SUBSIDIES_TRACKER', 'PACKAGES', 'INSTALLATION_MILESTONES');
        `);

        for (const menu of defaultMenus) {
            await client.query(
                `INSERT INTO menus (uid, name, code, route, icon, sort_order, is_active)
                 VALUES ($1, $2, $3, $4, $5, $6, 1)
                 ON CONFLICT (code) DO NOTHING`,
                [uuidv4(), menu.name, menu.code, menu.route, menu.icon, menu.sortOrder]
            );
        }
        await client.query("COMMIT");
        logger.info(`✅ Default menus seeded.`);

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

        // 5. Grant mapped access to Master role
        const allMenusRes = await client.query("SELECT uid, code FROM menus");

        for (const menuRow of allMenusRes.rows) {
            const mappedMenu = defaultMenus.find(m => m.code === menuRow.code);
            const perms = mappedMenu?.permissions;
            if (!perms) continue;

            await client.query(
                `UPDATE role_menu_permissions 
                 SET can_view = $3, can_create = $4, can_edit = $5, can_delete = $6, can_setting = $7 
                 WHERE role_uid = $1 AND menu_uid = $2`,
                [roleUid, menuRow.uid, perms.view, perms.create, perms.edit, perms.delete, perms.setting]
            );
            // Insert if not exists
            await client.query(
                `INSERT INTO role_menu_permissions (tenant_uid, role_uid, menu_uid, can_view, can_create, can_edit, can_delete, can_setting)
                 SELECT $1::varchar, $2::varchar, $3::varchar, $4, $5, $6, $7, $8
                 WHERE NOT EXISTS (
                     SELECT 1 FROM role_menu_permissions WHERE role_uid = $2 AND menu_uid = $3
                 )`,
                [tenantUid, roleUid, menuRow.uid, perms.view, perms.create, perms.edit, perms.delete, perms.setting]
            );

            // --- Update User Permissions for Admin User ---
            // Update if exists
            await client.query(
                `UPDATE user_menu_permissions 
                 SET can_view = $3, can_create = $4, can_edit = $5, can_delete = $6, can_setting = $7 
                 WHERE user_uid = $1 AND menu_uid = $2`,
                [userUid, menuRow.uid, perms.view, perms.create, perms.edit, perms.delete, perms.setting]
            );
            // Insert if not exists
            await client.query(
                `INSERT INTO user_menu_permissions (tenant_uid, user_uid, menu_uid, can_view, can_create, can_edit, can_delete, can_setting)
                 SELECT $1::varchar, $2::varchar, $3::varchar, $4, $5, $6, $7, $8
                 WHERE NOT EXISTS (
                     SELECT 1 FROM user_menu_permissions WHERE user_uid = $2 AND menu_uid = $3
                 )`,
                [tenantUid, userUid, menuRow.uid, perms.view, perms.create, perms.edit, perms.delete, perms.setting]
            );
        }
        logger.info(`✅ Synced mapped menu access to Master role and Admin user.`);

        // Seed default settings/document types for Head Office tenant
        await seedTenantDefaults(client, tenantUid);

        await client.query("COMMIT");

        // 9. Seed products and their specifications
        await seedProducts(pool);

        logger.info("🎉 Database seed completed successfully!");

    } catch (error) {
        await client.query("ROLLBACK");
        logger.error("❌ Seed failed:", error);
        throw error;
    } finally {
        client.release();
    }
}

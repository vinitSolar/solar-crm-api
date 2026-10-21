import type { Pool, PoolClient } from "pg";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../../logger/index.js";

type Queryable = Pool | PoolClient;

export async function seedPackages(db: Queryable, tenantUid?: string) {
    try {
        logger.info("🌱 Seeding packages...");

        let targetTenantUid = tenantUid;
        if (!targetTenantUid) {
            const tenantRes = await db.query("SELECT uid FROM tenants WHERE type = 0 ORDER BY created_at ASC LIMIT 1");
            if (tenantRes.rowCount && tenantRes.rowCount > 0) {
                targetTenantUid = tenantRes.rows[0].uid;
            }
        }

        if (!targetTenantUid) {
            logger.warn("No Head Office tenant found for seeding packages. Skipping.");
            return;
        }

        // Get admin user
        const adminRes = await db.query("SELECT uid FROM users WHERE email = 'admin@sunselect.com' LIMIT 1");
        const adminUid = adminRes.rows[0]?.uid || targetTenantUid;

        // Fetch products
        const productsRes = await db.query("SELECT uid, product_code, price_per_unit FROM products WHERE is_deleted = 0");
        const productsByCode = new Map(productsRes.rows.map(row => [row.product_code, row]));

        const panel540 = productsByCode.get("PANEL-WAAREE-540W");
        const panel440 = productsByCode.get("PANEL-WAAREE-440W");
        const inv5kw = productsByCode.get("INV-WAAREE-5KW");
        const inv10kw = productsByCode.get("INV-WAAREE-10KW");

        const defaultPackages = [
            {
                name: "3 kW Residential Solar Package",
                packageCode: "PKG-3KW-RES",
                description: "Complete 3 kW residential rooftop solar system including mono PERC panels, on-grid inverter, and installation accessories.",
                capacityKw: 3,
                recommendedPrice: 185000,
                gst: 8.9,
                products: [
                    { productUid: panel440?.uid, quantity: 7, unitPrice: panel440 ? Number(panel440.price_per_unit) : 11800 },
                    { productUid: inv5kw?.uid, quantity: 1, unitPrice: inv5kw ? Number(inv5kw.price_per_unit) : 38000 },
                ].filter(p => Boolean(p.productUid))
            },
            {
                name: "5 kW Standard Solar Package",
                packageCode: "PKG-5KW-STD",
                description: "5 kW premium rooftop solar system with high-efficiency 540Wp mono PERC panels and 5kW inverter.",
                capacityKw: 5,
                recommendedPrice: 295000,
                gst: 8.9,
                products: [
                    { productUid: panel540?.uid, quantity: 10, unitPrice: panel540 ? Number(panel540.price_per_unit) : 14500 },
                    { productUid: inv5kw?.uid, quantity: 1, unitPrice: inv5kw ? Number(inv5kw.price_per_unit) : 38000 },
                ].filter(p => Boolean(p.productUid))
            },
            {
                name: "10 kW Commercial Solar Package",
                packageCode: "PKG-10KW-COM",
                description: "10 kW heavy-duty commercial solar setup with high output panels and 3-phase on-grid inverter.",
                capacityKw: 10,
                recommendedPrice: 550000,
                gst: 8.9,
                products: [
                    { productUid: panel540?.uid, quantity: 20, unitPrice: panel540 ? Number(panel540.price_per_unit) : 14500 },
                    { productUid: inv10kw?.uid, quantity: 1, unitPrice: inv10kw ? Number(inv10kw.price_per_unit) : 62000 },
                ].filter(p => Boolean(p.productUid))
            }
        ];

        for (const pkg of defaultPackages) {
            const existing = await db.query("SELECT uid FROM packages WHERE package_code = $1 AND is_deleted = false", [pkg.packageCode]);
            if (existing.rowCount && existing.rowCount > 0) {
                logger.info(`ℹ️ Package '${pkg.name}' (${pkg.packageCode}) already exists. Skipping.`);
                continue;
            }

            const packageUid = uuidv4();
            await db.query(`
                INSERT INTO packages (uid, tenant_uid, name, package_code, description, capacity_kw, recomended_price, gst, is_active, is_deleted, created_by, updated_by)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, false, $9, $9)
            `, [packageUid, targetTenantUid, pkg.name, pkg.packageCode, pkg.description, pkg.capacityKw, pkg.recommendedPrice, pkg.gst, adminUid]);

            for (const prod of pkg.products) {
                await db.query(`
                    INSERT INTO package_products (uid, package_uid, product_uid, quantity, unit_price_snapshot, created_by, updated_by)
                    VALUES ($1, $2, $3, $4, $5, $6, $6)
                `, [uuidv4(), packageUid, prod.productUid, prod.quantity, prod.unitPrice, adminUid]);
            }

            logger.info(`✅ Seeded package '${pkg.name}' (${pkg.packageCode}) successfully.`);
        }
    } catch (error) {
        logger.error("Failed to seed packages:", { error });
    }
}

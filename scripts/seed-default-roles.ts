import "dotenv/config";
import pool from "../packages/connection.js";
import { logger } from "../packages/logger/index.js";
import { seedDefaultRoles } from "../packages/database/seeds/seed_default_roles.js";
import { redisClient } from "../packages/redis/index.js";

async function run() {
    console.log("=================================================");
    console.log("  SunSelect CRM - Seed Default Roles & Permissions");
    console.log("=================================================\n");

    const client = await pool.connect();

    try {
        // Optional tenant code argument (e.g. npx tsx scripts/seed-default-roles.ts --tenant=HO)
        const tenantArg = process.argv.find((arg) => arg.startsWith("--tenant="));
        const targetCode = tenantArg ? tenantArg.split("=")[1]?.toUpperCase() : null;

        let query = "SELECT uid, code, name, type FROM tenants WHERE is_deleted = 0";
        const params: any[] = [];

        if (targetCode) {
            query += " AND code = $1";
            params.push(targetCode);
        }

        query += " ORDER BY type ASC, created_at ASC";

        const tenantsRes = await client.query(query, params);

        if (tenantsRes.rows.length === 0) {
            console.log(targetCode ? `❌ Tenant with code '${targetCode}' not found.` : "❌ No active tenants found.");
            process.exit(1);
        }

        console.log(`Found ${tenantsRes.rows.length} tenant(s) to process:\n`);

        let totalCreated = 0;
        let totalSkipped = 0;

        for (const tenant of tenantsRes.rows) {
            console.log(`▶ Processing Tenant: [${tenant.code}] ${tenant.name} (type: ${tenant.type === 0 ? "Head Office" : "Franchise"})`);
            
            await client.query("BEGIN");
            const result = await seedDefaultRoles(client, tenant.uid, tenant.type, "SYSTEM");
            await client.query("COMMIT");

            totalCreated += result.created;
            totalSkipped += result.skipped;
            console.log(`  ✔ Roles Created: ${result.created}, Skipped (Already Exists): ${result.skipped}\n`);
        }

        // Invalidate Redis permission cache so changes take effect immediately
        try {
            if (redisClient && redisClient.status === "ready") {
                const keys = await redisClient.keys("cache:perm:*");
                if (keys.length > 0) {
                    await redisClient.del(...keys);
                    console.log(`✔ Invalidated ${keys.length} cached permission entries in Redis.`);
                }
            }
        } catch (cacheErr) {
            logger.warn("Could not flush Redis permission cache (skipped):", cacheErr);
        }

        console.log("=================================================");
        console.log(`🎉 Seeding completed! Total Created: ${totalCreated}, Total Skipped: ${totalSkipped}`);
        console.log("=================================================");
        process.exit(0);
    } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        console.error("❌ Seeding default roles failed:", error);
        logger.error("Seeding default roles script error", { error });
        process.exit(1);
    } finally {
        client.release();
    }
}

run();

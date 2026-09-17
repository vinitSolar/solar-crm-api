import "dotenv/config";
import pool from "../packages/connection.js";
import { logger } from "../packages/logger/index.js";
import { seedInstallationMilestones } from "../packages/database/seeds/seed_installation_milestones.js";

async function run() {
    console.log("=================================================");
    console.log("  SunSelect CRM - Seed Installation Milestones   ");
    console.log("=================================================\n");

    const client = await pool.connect();

    try {
        // Optional tenant code argument (e.g. npx tsx scripts/seed-installation-milestones.ts --tenant=HO)
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
            console.log(`▶ Processing Tenant: [${tenant.code}] ${tenant.name} (${tenant.type === 0 ? "Head Office" : "Franchise"})`);

            await client.query("BEGIN");
            const result = await seedInstallationMilestones(client, tenant.uid, "SYSTEM");
            await client.query("COMMIT");

            totalCreated += result.created;
            totalSkipped += result.skipped;
            console.log(`  ✔ Milestones Created: ${result.created}, Skipped (Already Exists): ${result.skipped}\n`);
        }

        console.log("=================================================");
        console.log(`🎉 Seeding completed! Total Created: ${totalCreated}, Total Skipped: ${totalSkipped}`);
        console.log("=================================================");
        process.exit(0);
    } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        console.error("❌ Seeding installation milestones failed:", error);
        logger.error("Seeding installation milestones script error", { error });
        process.exit(1);
    } finally {
        client.release();
    }
}

run();

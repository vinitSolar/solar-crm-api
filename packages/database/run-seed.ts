import 'dotenv/config';
import pool from "@packages/connection.js";
import { seed } from "./seeds/seed.js";

async function runSeed() {
    try {
        console.log("🌱 Running core database seed...");
        await seed(pool);
        console.log("✅ Database seed completed successfully!");
    } catch (error) {
        console.error("❌ Error running seed:", error);
        process.exit(1);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

runSeed();

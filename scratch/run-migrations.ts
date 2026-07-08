import "@packages/config/index.js";
import { runMigrations } from "../packages/database/migrate.js";

async function run() {
    try {
        await runMigrations();
        console.log("Migrations ran successfully");
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();

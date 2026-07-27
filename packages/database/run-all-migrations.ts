import 'dotenv/config';
import { runMigrations } from "./migrate.js";

async function main() {
    console.log("Running all migrations...");
    try {
        await runMigrations();
        console.log("Migrations completed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

main();

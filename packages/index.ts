import pool from "./connection.js";
import { logger } from "./logger/index.js";

export async function connectDatabase() {
    try {
        const client = await pool.connect();
        logger.info("PostgreSQL connected");
        client.release();

        // Run database migrations automatically
        const { runMigrations } = await import("./database/migrate.js");
        await runMigrations();

    } catch (error) {
        logger.error("Database Connection Failed", error);
        process.exit(1);
    }
}

export { pool };
export * from "./redis/index.js";
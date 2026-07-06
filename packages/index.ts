import pool from "./connection.js";
import { logger } from "./logger/index.js";
import { Client } from "pg";

export async function connectDatabase() {
    try {
        // Ensure database exists before connecting the main pool
        const defaultClient = new Client({
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: "postgres"
        });
        await defaultClient.connect();
        const dbName = process.env.DB_NAME;
        const res = await defaultClient.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]);
        if (res.rowCount === 0) {
            logger.info(`Database "${dbName}" does not exist. Creating...`);
            const safeDbName = dbName?.replace(/"/g, '""');
            await defaultClient.query(`CREATE DATABASE "${safeDbName}"`);
            logger.info(`Database "${dbName}" created successfully.`);
        }
        await defaultClient.end();

        // Now connect the application pool
        const client = await pool.connect();
        logger.info("PostgreSQL connected");
        client.release();

        // Run database migrations automatically
        const { runMigrations } = await import("./database/migrate.js");
        await runMigrations();

        // Run database seeds automatically
        const { seed } = await import("./database/seeds/seed.js");
        await seed(pool);

    } catch (error) {
        logger.error("Database Connection Failed", error);
        process.exit(1);
    }
}

export { pool };
export * from "./redis/index.js";
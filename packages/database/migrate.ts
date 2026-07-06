import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "../index.js";
import { logger } from "../logger/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
    const client = await pool.connect();
    
    try {
        // Create migrations table if it doesn't exist
        await client.query(`
            CREATE TABLE IF NOT EXISTS _migrations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Read all sql files from migrations directory
        const migrationsDir = path.join(__dirname, "migrations");
        const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith(".sql")).sort();

        // Get already executed migrations
        const { rows } = await client.query("SELECT name FROM _migrations");
        const executedMigrations = new Set(rows.map(row => row.name));

        let migrationCount = 0;

        for (const file of files) {
            if (!executedMigrations.has(file)) {
                logger.info(`Running migration: ${file}`);
                const filePath = path.join(migrationsDir, file);
                const sql = fs.readFileSync(filePath, "utf-8");

                try {
                    await client.query("BEGIN");
                    await client.query(sql);
                    await client.query("INSERT INTO _migrations (name) VALUES ($1)", [file]);
                    await client.query("COMMIT");
                    logger.info(`Successfully migrated: ${file}`);
                    migrationCount++;
                } catch (error: any) {
                    await client.query("ROLLBACK");
                    // 42P07 is Postgres error code for duplicate_table/relation already exists
                    if (error.code === '42P07') {
                        logger.warn(`Relation already exists in ${file}, assuming it was applied manually.`);
                        await client.query("INSERT INTO _migrations (name) VALUES ($1)", [file]);
                    } else {
                        logger.error(`Failed to migrate: ${file}`, error);
                        throw error;
                    }
                }
            }
        }

        if (migrationCount === 0) {
            logger.info("Database is up to date. No new migrations to run.");
        } else {
            logger.info(`Successfully executed ${migrationCount} migrations.`);
        }

    } catch (error) {
        logger.error("Migration Runner Failed", error);
        throw error;
    } finally {
        client.release();
    }
}

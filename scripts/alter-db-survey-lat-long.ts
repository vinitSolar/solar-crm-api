import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER || "postgres",
    host: process.env.DB_HOST || "localhost",
    database: process.env.DB_NAME || "sunselect",
    password: process.env.DB_PASSWORD || "password",
    port: parseInt(process.env.DB_PORT || "5432"),
});

async function run() {
    try {
        console.log("Migrating latitude and longitude from site_surveys to site_survey_details...");
        
        // 1. Add columns to site_survey_details if they don't exist
        await pool.query(`
            ALTER TABLE site_survey_details 
            ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 7) NULL,
            ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7) NULL;
        `);
        console.log("Added columns to site_survey_details");

        // 2. Data Migration: Copy existing lat/long from site_surveys to site_survey_details
        // This ensures if any surveys had coordinates, they are preserved in the details table.
        // It requires a detail record to exist.
        await pool.query(`
            UPDATE site_survey_details ssd
            SET latitude = ss.latitude,
                longitude = ss.longitude
            FROM site_surveys ss
            WHERE ssd.site_survey_uid = ss.uid
              AND (ss.latitude IS NOT NULL OR ss.longitude IS NOT NULL)
              AND ssd.latitude IS NULL;
        `);
        console.log("Migrated data to site_survey_details");

        // 3. Drop columns from site_surveys
        await pool.query(`
            ALTER TABLE site_surveys 
            DROP COLUMN IF EXISTS latitude,
            DROP COLUMN IF EXISTS longitude;
        `);
        console.log("Dropped columns from site_surveys");

        console.log("Migration successful.");
    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

run();

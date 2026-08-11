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
        console.log("Updating master_document_types applicable_modules...");

        // Update Aadhaar Card
        await pool.query(`
            UPDATE master_document_types 
            SET applicable_modules = '{"site_survey","project","subsidy_tracker","finance","discom"}'
            WHERE name = 'Aadhaar Card' AND is_system = 1 AND tenant_uid IS NULL;
        `);

        // Update PAN Card
        await pool.query(`
            UPDATE master_document_types 
            SET applicable_modules = '{"site_survey","project","finance","discom"}'
            WHERE name = 'PAN Card' AND is_system = 1 AND tenant_uid IS NULL;
        `);

        // Update Electricity Bill
        await pool.query(`
            UPDATE master_document_types 
            SET applicable_modules = '{"site_survey","discom"}'
            WHERE name = 'Electricity Bill' AND is_system = 1 AND tenant_uid IS NULL;
        `);

        // Update GST Certificate
        await pool.query(`
            UPDATE master_document_types 
            SET applicable_modules = '{"finance"}'
            WHERE name = 'GST Certificate' AND is_system = 1 AND tenant_uid IS NULL;
        `);

        // Update Bank Cancelled Cheque
        await pool.query(`
            UPDATE master_document_types 
            SET applicable_modules = '{"finance"}'
            WHERE name = 'Bank Cancelled Cheque' AND is_system = 1 AND tenant_uid IS NULL;
        `);

        // Update Partnership Deed / COI
        await pool.query(`
            UPDATE master_document_types 
            SET applicable_modules = '{"finance"}'
            WHERE name = 'Partnership Deed / COI' AND is_system = 1 AND tenant_uid IS NULL;
        `);

        console.log("Successfully updated applicable_modules in the live database.");
    } catch (e) {
        console.error("Error updating master_document_types:", e);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

run();

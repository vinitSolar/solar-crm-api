import 'dotenv/config';
import pool from "../packages/connection.js";

async function run() {
    try {
        console.log("Adding is_common_for_all_modules to master_document_types...");
        await pool.query(`
            ALTER TABLE master_document_types 
            ADD COLUMN IF NOT EXISTS is_common_for_all_modules SMALLINT DEFAULT 0;
        `);
        console.log("Success! Column added.");
    } catch (e) {
        console.error("Error altering table:", e);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

run();

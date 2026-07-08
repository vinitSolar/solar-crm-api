import "@packages/config/index.js";
import pool from "../packages/connection.js";

async function run() {
    try {
        await pool.query(`
            ALTER TABLE site_survey_details
            ADD COLUMN needs_structure_extension SMALLINT DEFAULT 0,
            ADD COLUMN needs_optimizer SMALLINT DEFAULT 0,
            ADD COLUMN optimizer_count INTEGER;
        `);
        console.log("Columns added successfully");
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();

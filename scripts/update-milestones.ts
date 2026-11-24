import "dotenv/config";
import pool from "../packages/connection.js";
import { DEFAULT_INSTALLATION_MILESTONES } from "../apps/api/src/modules/installation-milestones/constants/installation-milestone.constants.js";

async function run() {
    const client = await pool.connect();
    try {
        console.log("=== UPDATING INSTALLATION MILESTONES ===");
        await client.query("BEGIN");

        // 1. Update installation_milestones templates
        for (const m of DEFAULT_INSTALLATION_MILESTONES) {
            const res = await client.query(
                `UPDATE installation_milestones 
                 SET name = $1, description = $2, requires_document = $3, allow_multiple_images = $4, updated_at = NOW()
                 WHERE sort_order = $5`,
                [m.name, m.description, m.requiresDocument, m.allowMultipleImages, m.sortOrder]
            );
            console.log(`Updated template sort_order ${m.sortOrder} -> "${m.name}": ${res.rowCount} row(s) updated`);
        }

        // 2. Update project_installation_milestones for existing projects
        for (const m of DEFAULT_INSTALLATION_MILESTONES) {
            const res = await client.query(
                `UPDATE project_installation_milestones
                 SET title = $1, description = $2, updated_at = NOW()
                 WHERE sequence_no = $3`,
                [m.name, m.description, m.sortOrder]
            );
            console.log(`Updated project milestones sequence_no ${m.sortOrder} -> "${m.name}": ${res.rowCount} row(s) updated`);
        }

        await client.query("COMMIT");
        console.log("=== MILESTONES UPDATE COMPLETED SUCCESSFULLY ===");
    } catch (e) {
        await client.query("ROLLBACK").catch(() => {});
        console.error("Failed to update milestones:", e);
        process.exit(1);
    } finally {
        client.release();
        process.exit(0);
    }
}

run();

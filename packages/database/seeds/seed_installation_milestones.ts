import type { Pool, PoolClient } from "pg";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../../logger/index.js";
import { DEFAULT_INSTALLATION_MILESTONES } from "../../../apps/api/src/modules/installation-milestones/constants/installation-milestone.constants.js";

type Queryable = Pool | PoolClient;

/**
 * Seeds default installation milestones for a given tenant.
 * If a milestone with the same name already exists (case-insensitive) for that tenant, it is skipped.
 */
export async function seedInstallationMilestones(
    client: Queryable,
    tenantUid: string,
    createdBy: string = "SYSTEM"
): Promise<{ created: number; skipped: number }> {
    logger.info(`🌱 Seeding installation milestones for tenant: ${tenantUid}...`);

    let createdCount = 0;
    let skippedCount = 0;

    for (const milestone of DEFAULT_INSTALLATION_MILESTONES) {
        // Check if milestone already exists with same name for this tenant
        const existing = await client.query(
            "SELECT uid, name FROM installation_milestones WHERE tenant_uid::varchar = $1 AND LOWER(TRIM(name)) = LOWER(TRIM($2)) AND is_deleted = 0 LIMIT 1",
            [tenantUid, milestone.name]
        );

        if (existing.rows.length > 0) {
            skippedCount++;
            logger.info(`ℹ️ Installation milestone '${milestone.name}' already exists for tenant ${tenantUid}. Skipping.`);
            continue;
        }

        const milestoneUid = uuidv4();
        await client.query(
            `INSERT INTO installation_milestones (
                uid, tenant_uid, name, description, sort_order, requires_document, allow_multiple_images, is_system, is_active, is_deleted, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, 1, 1, 0, $8)`,
            [
                milestoneUid,
                tenantUid,
                milestone.name,
                milestone.description,
                milestone.sortOrder,
                milestone.requiresDocument,
                milestone.allowMultipleImages,
                createdBy,
            ]
        );
        createdCount++;
        logger.info(`✅ Created installation milestone '${milestone.name}' (${milestoneUid}) for tenant ${tenantUid}`);
    }

    logger.info(`🎉 Completed installation milestone seeding for tenant ${tenantUid} (Created: ${createdCount}, Skipped: ${skippedCount})`);
    return { created: createdCount, skipped: skippedCount };
}

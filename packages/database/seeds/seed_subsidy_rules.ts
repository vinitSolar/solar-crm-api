import "dotenv/config";
import type { Pool } from "pg";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../../logger/index.js";

export interface IDefaultSubsidyRuleSeed {
    schemeName: string;
    stateUid: string | null;
    subsidyPerKw: number;
    maximumSubsidyAmount: number;
    description: string;
    requiredDocumentNames: string[];
}

export const DEFAULT_SUBSIDY_RULES: IDefaultSubsidyRuleSeed[] = [
    {
        schemeName: "PM Surya Ghar: Muft Bijli Yojana",
        stateUid: null, // Central / All States
        subsidyPerKw: 30000.00,
        maximumSubsidyAmount: 78000.00,
        description: "PM Surya Ghar: Muft Bijli Yojana - Central Government rooftop solar subsidy scheme providing financial assistance up to ₹78,000 for residential households (₹30,000/kW up to 2 kW, ₹18,000 for 3rd kW, capped at ₹78,000 for 3 kW and above).",
        requiredDocumentNames: [
            "Aadhaar Card",
            "Electricity Bill",
            "Bank Cancelled Cheque",
            "Site Photo"
        ]
    }
];

export async function seedSubsidyRules(pool: Pool): Promise<void> {
    const client = await pool.connect();

    try {
        logger.info("🌱 Seeding State & Central Subsidy Rules (PM Surya Ghar)...");
        await client.query("BEGIN");

        for (const rule of DEFAULT_SUBSIDY_RULES) {
            // 1. Check if an existing PM Surya Ghar or Central subsidy rule exists
            const existingRes = await client.query<{ uid: string; id: string }>(
                `SELECT uid, id FROM state_subsidy_rules 
                 WHERE LOWER(scheme_name) LIKE '%surya%'
                    OR LOWER(scheme_name) LIKE '%suryaghar%'
                    OR state_uid = 'All'
                    OR (state_uid IS NULL AND is_deleted = 0)
                 ORDER BY id ASC
                 LIMIT 1`
            );

            let subsidyUid: string;

            if (existingRes.rows.length > 0 && existingRes.rows[0]) {
                subsidyUid = existingRes.rows[0].uid;
                logger.info(`🔄 Updating existing subsidy rule for '${rule.schemeName}' (${subsidyUid})...`);
                await client.query(
                    `UPDATE state_subsidy_rules
                     SET scheme_name = $1,
                         state_uid = $2,
                         subsidy_per_kw = $3,
                         maximum_subsidy_amount = $4,
                         description = $5,
                         is_active = 1,
                         is_deleted = 0,
                         updated_at = CURRENT_TIMESTAMP
                     WHERE uid = $6`,
                    [
                        rule.schemeName,
                        rule.stateUid,
                        rule.subsidyPerKw,
                        rule.maximumSubsidyAmount,
                        rule.description,
                        subsidyUid
                    ]
                );
            } else {
                subsidyUid = uuidv4();
                logger.info(`✨ Inserting new subsidy rule for '${rule.schemeName}' (${subsidyUid})...`);
                await client.query(
                    `INSERT INTO state_subsidy_rules 
                     (uid, scheme_name, state_uid, subsidy_per_kw, maximum_subsidy_amount, description, is_active, is_deleted, created_by, updated_by)
                     VALUES ($1, $2, $3, $4, $5, $6, 1, 0, 'SYSTEM', 'SYSTEM')`,
                    [
                        subsidyUid,
                        rule.schemeName,
                        rule.stateUid,
                        rule.subsidyPerKw,
                        rule.maximumSubsidyAmount,
                        rule.description
                    ]
                );
            }

            // 2. Link Required Documents in subsidy_required_documents
            if (rule.requiredDocumentNames && rule.requiredDocumentNames.length > 0) {
                for (let i = 0; i < rule.requiredDocumentNames.length; i++) {
                    const docName = rule.requiredDocumentNames[i];
                    if (!docName) continue;

                    // Find master document type by name
                    const docTypeRes = await client.query<{ uid: string }>(
                        `SELECT uid FROM master_document_types 
                         WHERE LOWER(name) = LOWER($1) AND is_deleted = 0 
                         LIMIT 1`,
                        [docName]
                    );

                    if (docTypeRes.rows.length > 0 && docTypeRes.rows[0]) {
                        const docTypeUid = docTypeRes.rows[0].uid;

                        // Check if requirement mapping already exists
                        const existingMapping = await client.query<{ uid: string }>(
                            `SELECT uid FROM subsidy_required_documents 
                             WHERE subsidy_uid = $1 AND document_type_uid = $2`,
                            [subsidyUid, docTypeUid]
                        );

                        if (existingMapping.rows.length > 0 && existingMapping.rows[0]) {
                            await client.query(
                                `UPDATE subsidy_required_documents 
                                 SET sort_order = $1, is_mandatory = 1, is_active = 1, is_deleted = 0, updated_at = CURRENT_TIMESTAMP
                                 WHERE uid = $2`,
                                [i + 1, existingMapping.rows[0].uid]
                            );
                        } else {
                            await client.query(
                                `INSERT INTO subsidy_required_documents 
                                 (uid, subsidy_uid, document_type_uid, sort_order, is_mandatory, is_active, is_deleted, created_by, updated_by)
                                 VALUES ($1, $2, $3, $4, 1, 1, 0, 'SYSTEM', 'SYSTEM')`,
                                [uuidv4(), subsidyUid, docTypeUid, i + 1]
                            );
                        }
                    } else {
                        logger.warn(`⚠️ Master document type not found for '${docName}', skipping document link.`);
                    }
                }
            }
        }

        await client.query("COMMIT");
        logger.info("✅ Subsidy rules seeded successfully!");
    } catch (error) {
        await client.query("ROLLBACK");
        logger.error("❌ Failed to seed subsidy rules:", error);
        throw error;
    } finally {
        client.release();
    }
}

// Allow standalone execution: npx tsx packages/database/seeds/seed_subsidy_rules.ts
if (process.argv[1]?.endsWith("seed_subsidy_rules.ts") || process.argv[1]?.endsWith("seed_subsidy_rules.js")) {
    const { default: pool } = await import("@packages/connection.js");
    seedSubsidyRules(pool)
        .then(async () => {
            await pool.end();
            process.exit(0);
        })
        .catch(async (err) => {
            logger.error("❌ Standalone seed failed:", err);
            await pool.end();
            process.exit(1);
        });
}

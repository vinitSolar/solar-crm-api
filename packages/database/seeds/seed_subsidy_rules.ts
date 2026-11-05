import "dotenv/config";
import type { Pool } from "pg";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../../logger/index.js";

export interface IDefaultSubsidyRuleSeed {
    schemeName: string;
    stateName?: string | null;
    stateUid: string | null;
    calculationType: string;
    calculationConfig: Record<string, any>;
    subsidyPerKw: number;
    maximumSubsidyAmount: number;
    categories?: number[];
    categoryRates?: Array<{
        categories: number[];
        subsidyPerKw: number;
        maximumSubsidyAmount: number;
    }>;
    description: string;
    requiredDocumentNames: string[];
}

export const DEFAULT_SUBSIDY_RULES: IDefaultSubsidyRuleSeed[] = [
    {
        schemeName: "PM Surya Ghar: Muft Bijli Yojana",
        stateUid: null, // Central / All States
        calculationType: "CAPACITY_SLABS",
        calculationConfig: {
            calculationType: "CAPACITY_SLABS",
            capacitySlabs: [
                { fromKw: 0, toKw: 2, ratePerKw: 30000 },
                { fromKw: 2, toKw: 3, ratePerKw: 18000 }
            ],
            maximumSubsidyAmount: 78000
        },
        subsidyPerKw: 30000.00,
        maximumSubsidyAmount: 78000.00,
        categories: [1, 2, 3, 4], // General / Open, EWS, OBC, SC/ST
        categoryRates: [
            {
                categories: [1, 2, 3, 4],
                subsidyPerKw: 30000.00,
                maximumSubsidyAmount: 78000.00,
            }
        ],
        description: "PM Surya Ghar: Muft Bijli Yojana - Central Government rooftop solar subsidy scheme providing financial assistance up to ₹78,000 for residential households (₹30,000/kW up to 2 kW, ₹18,000 for 3rd kW, capped at ₹78,000 for 3 kW and above).",
        requiredDocumentNames: [
            "Aadhaar Card",
            "Electricity Bill",
            "Bank Cancelled Cheque",
            "Site Photo"
        ]
    },
    {
        schemeName: "Gujarat State Top-Up Subsidy (Surya Gujarat)",
        stateName: "Gujarat",
        stateUid: null, // Resolved dynamically below
        calculationType: "BENCHMARK_TOPUP",
        calculationConfig: {
            calculationType: "BENCHMARK_TOPUP",
            maxEligibleKw: 2.18,
            benchmarkSlabs: [
                { fromKw: 0, toKw: 2, benchmarkRatePerKw: 50000 },
                { fromKw: 2, toKw: 2.18, benchmarkRatePerKw: 45000 }
            ],
            deductCentralSubsidy: true,
            coPayRates: [
                { categories: [1, 2, 3], coPayPercentage: 10 },
                { categories: [4], coPayPercentage: 5 }
            ],
            maximumSubsidyAmount: 39455
        },
        subsidyPerKw: 15619.00,
        maximumSubsidyAmount: 39455.00,
        categories: [1, 2, 3, 4],
        categoryRates: [
            {
                categories: [1, 2, 3],
                subsidyPerKw: 15619.00,
                maximumSubsidyAmount: 34050.00,
            },
            {
                categories: [4],
                subsidyPerKw: 18098.00,
                maximumSubsidyAmount: 39455.00,
            }
        ],
        description: "Government of Gujarat Top-Up Subsidy under Surya Gujarat / GUVNL for residential rooftop solar systems up to 2.18 kWp. Benchmark cost: ₹50,000/kW (first 2 kW), ₹45,000/kW (next 0.18 kW). Beneficiary co-pay: 10% for General/OBC/EWS, 5% for SC/ST. State covers remaining benchmark cost above Central CFA.",
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
        logger.info("🌱 Seeding State & Central Subsidy Rules (PM Surya Ghar & Gujarat Top-up)...");
        await client.query("BEGIN");

        for (const rule of DEFAULT_SUBSIDY_RULES) {
            const ruleCategories = rule.categories || [1, 2, 3, 4];
            const ruleCategoryRates = rule.categoryRates || [
                {
                    categories: ruleCategories,
                    subsidyPerKw: rule.subsidyPerKw,
                    maximumSubsidyAmount: rule.maximumSubsidyAmount,
                }
            ];

            let stateUid = rule.stateUid;
            if (rule.stateName) {
                const stateRes = await client.query<{ uid: string }>(
                    `SELECT uid FROM states WHERE LOWER(name) = LOWER($1) LIMIT 1`,
                    [rule.stateName]
                );
                if (stateRes.rows[0]) {
                    stateUid = stateRes.rows[0].uid;
                }
            }

            // Check if rule exists
            let existingRes;
            if (rule.stateName || stateUid) {
                existingRes = await client.query<{ uid: string; id: string }>(
                    `SELECT uid, id FROM state_subsidy_rules 
                     WHERE state_uid = $1 OR LOWER(scheme_name) LIKE '%gujarat%'
                     ORDER BY id ASC
                     LIMIT 1`,
                    [stateUid]
                );
            } else {
                existingRes = await client.query<{ uid: string; id: string }>(
                    `SELECT uid, id FROM state_subsidy_rules 
                     WHERE (LOWER(scheme_name) LIKE '%surya%' AND LOWER(scheme_name) LIKE '%ghar%')
                        OR state_uid = 'All'
                        OR (state_uid IS NULL AND is_deleted = 0)
                     ORDER BY id ASC
                     LIMIT 1`
                );
            }

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
                         categories = $6,
                         category_rates = $7,
                         calculation_type = $8,
                         calculation_config = $9,
                         is_active = 1,
                         is_deleted = 0,
                         updated_at = CURRENT_TIMESTAMP
                     WHERE uid = $10`,
                    [
                        rule.schemeName,
                        stateUid,
                        rule.subsidyPerKw,
                        rule.maximumSubsidyAmount,
                        rule.description,
                        ruleCategories,
                        JSON.stringify(ruleCategoryRates),
                        rule.calculationType,
                        JSON.stringify(rule.calculationConfig),
                        subsidyUid
                    ]
                );
            } else {
                subsidyUid = uuidv4();
                logger.info(`✨ Inserting new subsidy rule for '${rule.schemeName}' (${subsidyUid})...`);
                await client.query(
                    `INSERT INTO state_subsidy_rules 
                     (uid, scheme_name, state_uid, subsidy_per_kw, maximum_subsidy_amount, description, categories, category_rates, calculation_type, calculation_config, is_active, is_deleted, created_by, updated_by)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 1, 0, 'SYSTEM', 'SYSTEM')`,
                    [
                        subsidyUid,
                        rule.schemeName,
                        stateUid,
                        rule.subsidyPerKw,
                        rule.maximumSubsidyAmount,
                        rule.description,
                        ruleCategories,
                        JSON.stringify(ruleCategoryRates),
                        rule.calculationType,
                        JSON.stringify(rule.calculationConfig)
                    ]
                );
            }

            // Link Required Documents in subsidy_required_documents
            if (rule.requiredDocumentNames && rule.requiredDocumentNames.length > 0) {
                for (let i = 0; i < rule.requiredDocumentNames.length; i++) {
                    const docName = rule.requiredDocumentNames[i];
                    if (!docName) continue;

                    const docTypeRes = await client.query<{ uid: string }>(
                        `SELECT uid FROM master_document_types 
                         WHERE LOWER(name) = LOWER($1) AND is_deleted = 0 
                         LIMIT 1`,
                        [docName]
                    );

                    if (docTypeRes.rows.length > 0 && docTypeRes.rows[0]) {
                        const docTypeUid = docTypeRes.rows[0].uid;

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

// Allow standalone execution
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

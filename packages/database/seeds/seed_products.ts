import { Pool } from "pg";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../../logger/index.js";

// Hardcoded product seed data defined purely by name and value
const PRODUCTS = [
  {
    categoryName: "Solar Panels",
    brandName: "Waaree Solar",
    unitName: "Pieces",
    name: "Waaree 540Wp Mono PERC Solar Panel",
    productCode: "PANEL-WAAREE-540W",
    pricePerUnit: 14500.00,
    gstPercentage: 12.00,
    capacity: "540",
    capacityUnit: "W",
    warranty: "25 Years Performance Warranty",
    modelNumber: "WSM-540",
    description: "High efficiency Mono PERC solar panel from Waaree Solar.",
    specifications: [
      { title: "STC Maximum Power (Pmax)", value: "540" },
      { title: "STC Voltage at Maximum Power (Vmpp)", value: "41.95" },
      { title: "STC Open Circuit Voltage (Voc)", value: "49.50" },
      { title: "STC Short Circuit Current (Isc)", value: "13.85" },
      { title: "STC Current at Maximum Power (Impp)", value: "12.88" },
      { title: "Height", value: "2279" },
      { title: "Width", value: "1134" },
      { title: "Weight", value: "28.5" },
      { title: "Cell Type", value: "Monocrystalline" },
      { title: "Frame Color", value: "Silver" },
      { title: "STC Panel Efficiency", value: "20.9" }
    ],
    documentTypeNames: [
      "Datasheet",
      "Warranty Document",
      "Installation Manual"
    ]
  },
  {
    categoryName: "Solar Panels",
    brandName: "Waaree Solar",
    unitName: "Pieces",
    name: "Waaree 440Wp Mono PERC Solar Panel",
    productCode: "PANEL-WAAREE-440W",
    pricePerUnit: 11800.00,
    gstPercentage: 12.00,
    capacity: "440",
    capacityUnit: "W",
    warranty: "25 Years Performance Warranty",
    modelNumber: "WSM-440",
    description: "High performance Mono PERC solar panel from Waaree Solar.",
    specifications: [
      { title: "STC Maximum Power (Pmax)", value: "440" },
      { title: "STC Voltage at Maximum Power (Vmpp)", value: "41.20" },
      { title: "STC Open Circuit Voltage (Voc)", value: "48.90" },
      { title: "STC Short Circuit Current (Isc)", value: "11.40" },
      { title: "STC Current at Maximum Power (Impp)", value: "10.68" },
      { title: "Height", value: "2008" },
      { title: "Width", value: "1002" },
      { title: "Weight", value: "22.0" },
      { title: "Cell Type", value: "Monocrystalline" },
      { title: "Frame Color", value: "Black" },
      { title: "STC Panel Efficiency", value: "19.8" }
    ],
    documentTypeNames: [
      "Datasheet",
      "Warranty Document"
    ]
  },
  {
    categoryName: "Inverters",
    brandName: "Waaree Solar",
    unitName: "Pieces",
    name: "Waaree 5kW On-Grid Solar Inverter",
    productCode: "INV-WAAREE-5KW",
    pricePerUnit: 38000.00,
    gstPercentage: 18.00,
    capacity: "5",
    capacityUnit: "kW",
    warranty: "5 Years Standard Warranty",
    modelNumber: "WSI-5K-OG",
    description: "High reliability on-grid string inverter with dual MPPT tracker.",
    specifications: [],
    documentTypeNames: [
      "Datasheet",
      "Warranty Document",
      "Installation Manual"
    ]
  },
  {
    categoryName: "Inverters",
    brandName: "Waaree Solar",
    unitName: "Pieces",
    name: "Waaree 10kW On-Grid Solar Inverter",
    productCode: "INV-WAAREE-10KW",
    pricePerUnit: 62000.00,
    gstPercentage: 18.00,
    capacity: "10",
    capacityUnit: "kW",
    warranty: "5 Years Standard Warranty",
    modelNumber: "WSI-10K-OG",
    description: "Three-phase high performance grid-tied solar inverter.",
    specifications: [],
    documentTypeNames: [
      "Datasheet",
      "Warranty Document",
      "Installation Manual"
    ]
  }
];

export async function seedProducts(pool: Pool, tenantUid?: string) {
    const client = await pool.connect();

    try {
        logger.info("🌱 Seeding products...");

        let resolvedTenantUid = tenantUid;
        if (!resolvedTenantUid) {
            const tenantRes = await client.query("SELECT tenant_uid FROM users WHERE email = 'admin@sunselect.com'");
            if (tenantRes.rowCount && tenantRes.rowCount > 0) {
                resolvedTenantUid = tenantRes.rows[0].tenant_uid;
            }
        }

        if (!resolvedTenantUid) {
            logger.warn("No tenant found for seeding products. Skipping.");
            return;
        }

        await client.query("BEGIN");

        // 1. Fetch categories dynamically
        const categoriesRes = await client.query("SELECT uid, name FROM product_categories WHERE is_deleted = 0");
        const categoriesByName = new Map(categoriesRes.rows.map(row => [row.name.toLowerCase(), row.uid]));

        // 2. Fetch units dynamically
        const unitsRes = await client.query("SELECT uid, name FROM product_units WHERE is_active = 1");
        const unitsByName = new Map(unitsRes.rows.map(row => [row.name.toLowerCase(), row.uid]));

        // 3. Fetch specifications dynamically
        const specsRes = await client.query("SELECT uid, title FROM product_specifications WHERE is_deleted = 0");
        const specsByName = new Map(specsRes.rows.map(row => [row.title.toLowerCase(), row.uid]));

        // 4. Fetch document types dynamically (filtered by tenant)
        const docTypesRes = await client.query("SELECT uid, name FROM product_document_types WHERE tenant_uid = $1 AND is_deleted = 0", [resolvedTenantUid]);
        const docTypesByName = new Map(docTypesRes.rows.map(row => [row.name.toLowerCase(), row.uid]));

        for (const prod of PRODUCTS) {
            // Check if product already exists
            const existingRes = await client.query(
                "SELECT uid FROM products WHERE product_code = $1 AND is_deleted = 0",
                [prod.productCode]
            );

            if (existingRes.rowCount && existingRes.rowCount > 0) {
                logger.info(`Product already exists with code ${prod.productCode}. Skipping.`);
                continue;
            }

            // Resolve Category UID from DB lookup by name
            const resolvedCategoryUid = categoriesByName.get(prod.categoryName.toLowerCase());
            if (!resolvedCategoryUid) {
                logger.warn(`Could not resolve category "${prod.categoryName}" for product "${prod.name}". Skipping.`);
                continue;
            }

            // Resolve Unit UID from DB lookup by name
            const resolvedUnitUid = unitsByName.get(prod.unitName.toLowerCase());
            if (!resolvedUnitUid) {
                logger.warn(`Could not resolve unit "${prod.unitName}" for product "${prod.name}". Skipping.`);
                continue;
            }

            // Ensure brand exists dynamically in database
            let brandUid = "";
            const brandRes = await client.query("SELECT uid FROM product_brands WHERE name = $1 AND is_deleted = 0", [prod.brandName]);
            if (brandRes.rowCount && brandRes.rowCount > 0) {
                brandUid = brandRes.rows[0].uid;
            } else {
                brandUid = uuidv4();
                await client.query(
                    `INSERT INTO product_brands (uid, name, description, sort_order, created_by)
                     VALUES ($1, $2, 'Seed brand for solar products', 1, 'SYSTEM')`,
                    [brandUid, prod.brandName]
                );
                logger.info(`✅ Created brand: ${prod.brandName} (${brandUid})`);
                // Update categories map in case brand creation affects state (not here, but good practice)
            }

            const productUid = uuidv4();

            // Insert Product
            const insertProductQuery = `
                INSERT INTO products (
                    uid, category_uid, brand_uid, unit_uid, name, product_code,
                    price_per_unit, gst_percentage, capacity, capacity_unit,
                    warranty, description, model_number, images, created_by
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::text[], 'SYSTEM')
            `;
            const productValues = [
                productUid,
                resolvedCategoryUid,
                brandUid,
                resolvedUnitUid,
                prod.name,
                prod.productCode,
                prod.pricePerUnit,
                prod.gstPercentage,
                prod.capacity || null,
                prod.capacityUnit || null,
                prod.warranty || null,
                prod.description || null,
                prod.modelNumber || null,
                [] // images array
            ];

            await client.query(insertProductQuery, productValues);
            logger.info(`✅ Seeded product: ${prod.name} (${prod.productCode})`);

            // Insert Specifications dynamically mapping title to database specification UIDs
            if (prod.specifications && prod.specifications.length > 0) {
                for (const spec of prod.specifications) {
                    const resolvedSpecUid = specsByName.get(spec.title.toLowerCase());

                    if (resolvedSpecUid) {
                        await client.query(
                            `INSERT INTO product_specification_values (uid, product_uid, specification_uid, value, created_by)
                             VALUES ($1, $2, $3, $4, 'SYSTEM')`,
                            [uuidv4(), productUid, resolvedSpecUid, spec.value]
                        );
                    } else {
                        logger.warn(`Could not resolve specification "${spec.title}" in database. Skipping.`);
                    }
                }
            }

            // Insert Mock Product Documents dynamically mapping document type name to database UIDs
            if (prod.documentTypeNames && prod.documentTypeNames.length > 0) {
                for (const docTypeName of prod.documentTypeNames) {
                    const resolvedDocTypeUid = docTypesByName.get(docTypeName.toLowerCase());

                    if (resolvedDocTypeUid) {
                        const docUid = uuidv4();
                        const fileName = `sample_${docTypeName.toLowerCase().replace(/\s+/g, '_')}.pdf`;
                        await client.query(
                            `INSERT INTO product_documents (
                                uid, tenant_uid, product_uid, document_type_uid, original_file_name,
                                stored_file_name, file_path, mime_type, file_size, created_by
                            )
                             VALUES ($1, $2, $3, $4, $5, $6, $7, 'application/pdf', 10240, 'SYSTEM')`,
                            [
                                docUid,
                                resolvedTenantUid,
                                productUid,
                                resolvedDocTypeUid,
                                fileName,
                                fileName,
                                `https://example.com/documents/${fileName}`
                            ]
                        );
                    } else {
                        logger.warn(`Could not resolve document type "${docTypeName}" in database. Skipping.`);
                    }
                }
            }
        }

        await client.query("COMMIT");
        logger.info("✅ Products seed completed successfully!");

    } catch (error) {
        await client.query("ROLLBACK");
        logger.error("❌ Failed to seed products:", error);
        throw error;
    } finally {
        client.release();
    }
}

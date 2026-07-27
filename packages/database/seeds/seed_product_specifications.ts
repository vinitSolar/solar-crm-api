import { Pool } from "pg";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../../logger/index.js";

const VALUE_TYPES = {
    TEXT: 0,
    NUMBER: 1,
    DECIMAL: 2,
    DROPDOWN: 3,
    BOOLEAN: 4,
    DATE: 5,
    DYNAMIC_REFERENCE: 6,
};

const SPECIFICATIONS = [
    { title: "STC Maximum Power (Pmax)", valueType: VALUE_TYPES.DECIMAL, unit: "W" },
    { title: "STC Voltage at Maximum Power (Vmpp)", valueType: VALUE_TYPES.DECIMAL, unit: "V" },
    { title: "STC Open Circuit Voltage (Voc)", valueType: VALUE_TYPES.DECIMAL, unit: "V" },
    { title: "STC Short Circuit Current (Isc)", valueType: VALUE_TYPES.DECIMAL, unit: "A" },
    { title: "STC Current at Maximum Power (Impp)", valueType: VALUE_TYPES.DECIMAL, unit: "A" },
    { title: "Temperature Coefficient of Pmax", valueType: VALUE_TYPES.DECIMAL, unit: "%/°C" },
    { title: "Temperature Coefficient of Voc", valueType: VALUE_TYPES.DECIMAL, unit: "%/°C" },
    { title: "Temperature Coefficient of Isc", valueType: VALUE_TYPES.DECIMAL, unit: "%/°C" },
    { title: "First Year Power Degradation", valueType: VALUE_TYPES.DECIMAL, unit: "%" },
    { title: "Subsequent Annual Power Degradation", valueType: VALUE_TYPES.DECIMAL, unit: "%" },
    { title: "Height", valueType: VALUE_TYPES.DECIMAL, unit: "mm" },
    { title: "Width", valueType: VALUE_TYPES.DECIMAL, unit: "mm" },
    { title: "Depth", valueType: VALUE_TYPES.DECIMAL, unit: "mm" },
    { title: "Weight", valueType: VALUE_TYPES.DECIMAL, unit: "kg" },
    { title: "Pallet Weight", valueType: VALUE_TYPES.DECIMAL, unit: "kg" },
    { title: "Pallet Dimension - Length", valueType: VALUE_TYPES.DECIMAL, unit: "mm" },
    { title: "Pallet Dimension - Width", valueType: VALUE_TYPES.DECIMAL, unit: "mm" },
    { title: "Pallet Dimension - Height", valueType: VALUE_TYPES.DECIMAL, unit: "mm" },
    { title: "Cell", valueType: VALUE_TYPES.NUMBER, unit: null },
    { title: "Cell Technology", valueType: VALUE_TYPES.DYNAMIC_REFERENCE, unit: null },
    { title: "Cell Type", valueType: VALUE_TYPES.TEXT, unit: null },
    { title: "Frame Color", valueType: VALUE_TYPES.DROPDOWN, unit: null, options: ["Black", "Silver", "White"] },
    { title: "STC Panel Efficiency", valueType: VALUE_TYPES.DECIMAL, unit: "%" },
    { title: "NOCT Maximum Power (Pmax)", valueType: VALUE_TYPES.DECIMAL, unit: "W" },
    { title: "NOCT Voltage at Maximum Power (Vmpp)", valueType: VALUE_TYPES.DECIMAL, unit: "V" },
    { title: "NOCT Current at Maximum Power (Impp)", valueType: VALUE_TYPES.DECIMAL, unit: "A" },
    { title: "NOCT Open Circuit Voltage (Voc)", valueType: VALUE_TYPES.DECIMAL, unit: "V" },
    { title: "NOCT Short Circuit Current (Isc)", valueType: VALUE_TYPES.DECIMAL, unit: "A" },
    { title: "Frame Thickness", valueType: VALUE_TYPES.DECIMAL, unit: "mm" },
    { title: "Qty per Pallet", valueType: VALUE_TYPES.NUMBER, unit: null },
    { title: "Connector", valueType: VALUE_TYPES.TEXT, unit: null },
];

export async function seedProductSpecifications(pool: Pool) {
    const client = await pool.connect();
    
    try {
        logger.info("🌱 Seeding product specifications...");
        await client.query("BEGIN");
        
        // Ensure units exist and get their UIDs
        const missingUnits = [
            { name: "Volts", shortName: "V" },
            { name: "Amperes", shortName: "A" },
            { name: "Percentage per °C", shortName: "%/°C" },
            { name: "Percentage", shortName: "%" },
            { name: "Millimeters", shortName: "mm" },
            { name: "Kilograms", shortName: "kg" },
        ];
        
        for (const unit of missingUnits) {
            await client.query(
                `INSERT INTO product_units (uid, name, short_name, description, sort_order, is_active)
                 VALUES ($1, $2, $3, $4, 99, 1)
                 ON CONFLICT (name) DO NOTHING`,
                [uuidv4(), unit.name, unit.shortName, unit.name]
            );
        }
        
        const unitsRes = await client.query("SELECT uid, short_name FROM product_units");
        const unitMap = new Map();
        for (const row of unitsRes.rows) {
            unitMap.set(row.short_name, row.uid);
        }
        
        // Get or Create "Solar Panels" Product Category
        const categoryRes = await client.query("SELECT uid FROM product_categories WHERE name = 'Solar Panels'");
        let solarPanelCategoryUid = null;
        if (categoryRes.rowCount && categoryRes.rowCount > 0) {
            solarPanelCategoryUid = categoryRes.rows[0].uid;
        } else {
            solarPanelCategoryUid = uuidv4();
            await client.query(
                `INSERT INTO product_categories (uid, name, description, sort_order, is_active, is_dynamic, has_cell_category)
                 VALUES ($1, $2, $3, $4, 1, 0, 1)`,
                [solarPanelCategoryUid, "Solar Panels", "Photovoltaic solar panels", 1]
            );
        }
        
        let sortOrder = 1;
        
        for (const spec of SPECIFICATIONS) {
            let unitUid = null;
            if (spec.unit) {
                unitUid = unitMap.get(spec.unit);
            }
            
            // Check if specification exists
            const existingSpecRes = await client.query(
                "SELECT uid FROM product_specifications WHERE title = $1",
                [spec.title]
            );
            
            let specUid = null;
            if (existingSpecRes.rowCount && existingSpecRes.rowCount > 0) {
                specUid = existingSpecRes.rows[0].uid;
                logger.info(`Specification already exists: ${spec.title}`);
            } else {
                specUid = uuidv4();
                await client.query(
                    `INSERT INTO product_specifications (uid, title, value_type, unit_uid, is_active, created_by)
                     VALUES ($1, $2, $3, $4, 1, 'SYSTEM')`,
                    [specUid, spec.title, spec.valueType, unitUid]
                );
                
                // Seed options if applicable
                if (spec.options && spec.options.length > 0) {
                    let optionSortOrder = 1;
                    for (const opt of spec.options) {
                        await client.query(
                            `INSERT INTO product_specification_options (uid, specification_uid, value, sort_order, created_by)
                             VALUES ($1, $2, $3, $4, 'SYSTEM')`,
                            [uuidv4(), specUid, opt, optionSortOrder]
                        );
                        optionSortOrder++;
                    }
                }
            }
            
            // Map to Solar Panels Category
            const mappingCheck = await client.query(
                "SELECT uid FROM product_category_specifications WHERE category_uid = $1 AND specification_uid = $2",
                [solarPanelCategoryUid, specUid]
            );
            
            if (mappingCheck.rowCount === 0) {
                await client.query(
                    `INSERT INTO product_category_specifications (uid, category_uid, specification_uid, sort_order, is_required, default_visible, created_by)
                     VALUES ($1, $2, $3, $4, 0, 1, 'SYSTEM')`,
                    [uuidv4(), solarPanelCategoryUid, specUid, sortOrder]
                );
            }
            sortOrder++;
        }
        
        await client.query("COMMIT");
        logger.info("✅ Product specifications seeded successfully!");
        
    } catch (error) {
        await client.query("ROLLBACK");
        logger.error("❌ Failed to seed product specifications:", error);
        throw error;
    } finally {
        client.release();
    }
}

import type { PoolClient } from "pg";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../../logger/index.js";

export async function seedTenantDefaults(client: PoolClient, tenantUid: string, createdBy: string = "SYSTEM") {
    logger.info(`🌱 Seeding tenant defaults for tenant: ${tenantUid}...`);

    // 1. Seed Lead Sources
    const leadSources = [
        { name: "Other", sortOrder: 1, isDefault: 1 }
    ];
    for (const source of leadSources) {
        const existing = await client.query(
            "SELECT 1 FROM lead_sources WHERE tenant_uid = $1 AND name = $2 AND is_deleted = 0",
            [tenantUid, source.name]
        );
        if (existing.rowCount === 0) {
            await client.query(
                `INSERT INTO lead_sources (uid, tenant_uid, name, sort_order, is_default, created_by)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [uuidv4(), tenantUid, source.name, source.sortOrder, source.isDefault, createdBy]
            );
        }
    }

    // 2. Seed Lead Statuses
    const leadStatuses = [
        { name: "New", sortOrder: 1, isDefault: 1, isClosed: 0 },
        { name: "Contacted", sortOrder: 2, isDefault: 0, isClosed: 0 },
        { name: "Follow Up", sortOrder: 3, isDefault: 0, isClosed: 0 },
        { name: "Quotation Sent", sortOrder: 4, isDefault: 0, isClosed: 0 },
        { name: "Negotiation", sortOrder: 5, isDefault: 0, isClosed: 0 },
        { name: "Won", sortOrder: 6, isDefault: 0, isClosed: 1 },
        { name: "Lost", sortOrder: 7, isDefault: 0, isClosed: 1 }
    ];
    for (const status of leadStatuses) {
        const existing = await client.query(
            "SELECT 1 FROM lead_statuses WHERE tenant_uid = $1 AND name = $2 AND is_deleted = 0",
            [tenantUid, status.name]
        );
        if (existing.rowCount === 0) {
            await client.query(
                `INSERT INTO lead_statuses (uid, tenant_uid, name, sort_order, is_default, is_closed, created_by)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [uuidv4(), tenantUid, status.name, status.sortOrder, status.isDefault, status.isClosed, createdBy]
            );
        }
    }

    // 3. Seed Project Statuses
    const projectStatuses = [
        { name: "Not Started", sortOrder: 1, isDefault: 1, isClosed: 0 },
        { name: "In Progress", sortOrder: 2, isDefault: 0, isClosed: 0 },
        { name: "Commissioned", sortOrder: 3, isDefault: 0, isClosed: 1 },
        { name: "On Hold", sortOrder: 4, isDefault: 0, isClosed: 0 },
        { name: "Cancelled", sortOrder: 5, isDefault: 0, isClosed: 1 }
    ];
    for (const status of projectStatuses) {
        const existing = await client.query(
            "SELECT 1 FROM project_statuses WHERE tenant_uid = $1::uuid AND name = $2 AND is_deleted = 0",
            [tenantUid, status.name]
        );
        if (existing.rowCount === 0) {
            await client.query(
                `INSERT INTO project_statuses (uid, tenant_uid, name, sort_order, is_default, is_closed, created_by)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [uuidv4(), tenantUid, status.name, status.sortOrder, status.isDefault, status.isClosed, tenantUid] // using tenantUid for UUID created_by relation
            );
        }
    }

    // 4. Seed Survey Document Types
    const surveyDocTypes = [
        { name: "Roof Photos", description: "Photos of the roof where panels will be installed", isRequired: 1, allowMultiple: 1, sortOrder: 10 },
        { name: "Electricity Meter", description: "Photo of the current electricity meter", isRequired: 1, allowMultiple: 1, sortOrder: 20 },
        { name: "Distribution Board", description: "Photo of the main distribution board", isRequired: 1, allowMultiple: 1, sortOrder: 30 },
        { name: "Inverter Installation Area", description: "Area proposed for inverter installation", isRequired: 1, allowMultiple: 1, sortOrder: 60 }
    ];
    for (const docType of surveyDocTypes) {
        const existing = await client.query(
            "SELECT 1 FROM survey_document_types WHERE tenant_uid = $1 AND name = $2 AND is_deleted = 0",
            [tenantUid, docType.name]
        );
        if (existing.rowCount === 0) {
            await client.query(
                `INSERT INTO survey_document_types (uid, tenant_uid, name, description, is_required, allow_multiple, sort_order, is_system, created_by)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, 1, $8)`,
                [uuidv4(), tenantUid, docType.name, docType.description, docType.isRequired, docType.allowMultiple, docType.sortOrder, createdBy]
            );
        }
    }

    // 5. Seed Product Document Types
    const productDocTypes = [
        { name: "Datasheet", description: "Technical specification datasheet for the product", allowedExtensions: "pdf,doc,docx", allowMultiple: 0, isRequired: 0 },
        { name: "Warranty Document", description: "Warranty terms and guidelines", allowedExtensions: "pdf,jpg,jpeg,png", allowMultiple: 0, isRequired: 0 },
        { name: "Installation Manual", description: "Guide for installing and configuring the product", allowedExtensions: "pdf", allowMultiple: 0, isRequired: 0 },
        { name: "Technical Drawing", description: "Engineering drawings or schematics", allowedExtensions: "pdf,dwg,dxf,jpg,png", allowMultiple: 1, isRequired: 0 },
        { name: "Product Images", description: "Marketing or reference images of the product", allowedExtensions: "jpg,jpeg,png,webp", allowMultiple: 1, isRequired: 0 }
    ];
    for (const docType of productDocTypes) {
        const existing = await client.query(
            "SELECT 1 FROM product_document_types WHERE tenant_uid = $1 AND name = $2 AND is_deleted = 0",
            [tenantUid, docType.name]
        );
        if (existing.rowCount === 0) {
            await client.query(
                `INSERT INTO product_document_types (uid, tenant_uid, name, description, allowed_extensions, allow_multiple, is_required, created_by)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [uuidv4(), tenantUid, docType.name, docType.description, docType.allowedExtensions, docType.allowMultiple, docType.isRequired, createdBy]
            );
        }
    }

    // 6. Seed Franchise Document Types
    const franchiseDocTypes = [
        { name: "GST Certificate", description: "GST registration certificate", allowMultiple: 0, isRequired: 1, sortOrder: 1 },
        { name: "PAN Card", description: "PAN card of the business", allowMultiple: 0, isRequired: 1, sortOrder: 2 },
        { name: "CIN Certificate", description: "Certificate of Incorporation", allowMultiple: 0, isRequired: 0, sortOrder: 3 },
        { name: "MSME Certificate", description: "MSME/Udyam registration certificate", allowMultiple: 0, isRequired: 0, sortOrder: 4 },
        { name: "Trade License", description: "Trade license issued by local authority", allowMultiple: 0, isRequired: 0, sortOrder: 5 },
        { name: "Shop & Establishment Certificate", description: "Shop and establishment registration", allowMultiple: 0, isRequired: 0, sortOrder: 6 },
        { name: "Electricity Bill", description: "Recent electricity bill for office premises", allowMultiple: 0, isRequired: 0, sortOrder: 7 }
    ];
    for (const docType of franchiseDocTypes) {
        const existing = await client.query(
            "SELECT 1 FROM franchise_document_types WHERE tenant_uid = $1 AND name = $2 AND is_deleted = 0",
            [tenantUid, docType.name]
        );
        if (existing.rowCount === 0) {
            await client.query(
                `INSERT INTO franchise_document_types (uid, tenant_uid, name, description, allow_multiple, is_required, sort_order, created_by)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [uuidv4(), tenantUid, docType.name, docType.description, docType.allowMultiple, docType.isRequired, docType.sortOrder, createdBy]
            );
        }
    }

    // 7. Seed Quotation Terms & Conditions
    const quotationTerms = [
        { title: "Taxes & Duties", description: "All taxes and duties as applicable at the time of delivery will be extra." },
        { title: "Transportation Charges", description: "Transportation charges will be actuals and paid by the client." },
        { title: "Payment Terms", description: "100% advance along with purchase order." },
        { title: "Project Completion Period", description: "The project will be completed within 30 days from the date of advance receipt." },
        { title: "Additional Material / Work", description: "Any additional material or work beyond the scope will be charged extra." },
        { title: "System Handover", description: "System will be handed over to the client only after full payment." }
    ];
    for (let i = 0; i < quotationTerms.length; i++) {
        const term = quotationTerms[i];
        if (!term) continue;
        const existing = await client.query(
            "SELECT 1 FROM quotation_terms_conditions WHERE tenant_uid = $1::uuid AND title = $2 AND is_deleted = 0",
            [tenantUid, term.title]
        );
        if (existing.rowCount === 0) {
            await client.query(
                `INSERT INTO quotation_terms_conditions (uid, tenant_uid, title, description, sort_order, is_default, created_by)
                 VALUES ($1, $2, $3, $4, $5, 1, $6)`,
                [uuidv4(), tenantUid, term.title, term.description, i + 1, tenantUid] // using tenantUid for UUID created_by relation
            );
        }
    }

    // 8. Seed Quotation Scope of Work
    const quotationScope = [
        { title: "Roof Top Area @ 10 Sq.Mtr./KWp", value: "Customer Scope" },
        { title: "Civil Works", value: "Included" },
        { title: "Module Mounting Structure", value: "Included" },
        { title: "Mounting, Erection & Commissioning", value: "Included" },
        { title: "Power Evacuation (Solar Plant to Mains)", value: "Included @ 20 Mtr" },
        { title: "Earthing System", value: "Included" },
        { title: "DISCOM & Net Meter Charges", value: "Included" },
        { title: "Free Operation & Maintenance", value: "Included for 5 Years" }
    ];
    for (let i = 0; i < quotationScope.length; i++) {
        const scope = quotationScope[i];
        if (!scope) continue;
        const existing = await client.query(
            "SELECT 1 FROM quotation_scope_of_work WHERE tenant_uid = $1::uuid AND title = $2 AND is_deleted = 0",
            [tenantUid, scope.title]
        );
        if (existing.rowCount === 0) {
            await client.query(
                `INSERT INTO quotation_scope_of_work (uid, tenant_uid, title, value, sort_order, is_default, created_by)
                 VALUES ($1, $2, $3, $4, $5, 1, $6)`,
                [uuidv4(), tenantUid, scope.title, scope.value, i + 1, tenantUid] // using tenantUid for UUID created_by relation
            );
        }
    }

    logger.info(`✅ Seeded tenant defaults for tenant: ${tenantUid} successfully!`);
}

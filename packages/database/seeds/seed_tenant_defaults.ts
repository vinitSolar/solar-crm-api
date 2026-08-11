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


    // 7. Seed Quotation Terms & Conditions
    const quotationTerms = [
        { title: "Taxes & Duties", description: ["All taxes and duties as applicable at the time of delivery will be extra."] },
        { title: "Transportation Charges", description: ["Transportation charges will be actuals and paid by the client."] },
        { title: "Payment Terms", description: ["100% advance along with purchase order."] },
        { title: "Project Completion Period", description: ["The project will be completed within 30 days from the date of advance receipt."] },
        { title: "Additional Material / Work", description: ["Any additional material or work beyond the scope will be charged extra."] },
        { title: "System Handover", description: ["System will be handed over to the client only after full payment."] }
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

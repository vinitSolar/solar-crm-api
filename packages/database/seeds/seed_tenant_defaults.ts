import type { PoolClient } from "pg";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../../logger/index.js";
import { seedInstallationMilestones } from "./seed_installation_milestones.js";

export async function seedTenantDefaults(client: PoolClient, tenantUid: string, createdBy: string = "SYSTEM") {
    logger.info(`🌱 Seeding tenant defaults for tenant: ${tenantUid}...`);

    // 1. Seed Lead Sources
    const leadSources = [
        { name: "Website", color: "#14B8A6", sortOrder: 1, isDefault: 0 },
        { name: "Social Media", color: "#C026D3", sortOrder: 2, isDefault: 0 },
        { name: "Referral", color: "#84CC16", sortOrder: 3, isDefault: 0 },
        { name: "Walk-in", color: "#EAB308", sortOrder: 4, isDefault: 0 },
        { name: "Cold Call", color: "#7C3AED", sortOrder: 5, isDefault: 0 },
        { name: "Event/Exhibition", color: "#0EA5E9", sortOrder: 6, isDefault: 0 },
        { name: "Other", color: "#64748B", sortOrder: 7, isDefault: 1 }
    ];
    for (const source of leadSources) {
        const existing = await client.query(
            "SELECT 1 FROM lead_sources WHERE tenant_uid = $1 AND name = $2 AND is_deleted = 0",
            [tenantUid, source.name]
        );
        if (existing.rowCount === 0) {
            await client.query(
                `INSERT INTO lead_sources (uid, tenant_uid, name, color, sort_order, is_default, created_by)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [uuidv4(), tenantUid, source.name, source.color, source.sortOrder, source.isDefault, createdBy]
            );
        }
    }

    // 2. Seed Lead Statuses
    const leadStatuses = [
        { name: "Draft", color: "#94A3B8", sortOrder: 0, isDefault: 0, isClosed: 0, isDraft: 1 },
        { name: "New", color: "#3B82F6", sortOrder: 1, isDefault: 1, isClosed: 0, isDraft: 0 },
        { name: "Contacted", color: "#F59E0B", sortOrder: 2, isDefault: 0, isClosed: 0, isDraft: 0 },
        { name: "Follow Up", color: "#8B5CF6", sortOrder: 3, isDefault: 0, isClosed: 0, isDraft: 0 },
        { name: "Quotation Sent", color: "#06B6D4", sortOrder: 4, isDefault: 0, isClosed: 0, isDraft: 0 },
        { name: "Negotiation", color: "#F97316", sortOrder: 5, isDefault: 0, isClosed: 0, isDraft: 0 },
        { name: "Won", color: "#10B981", sortOrder: 6, isDefault: 0, isClosed: 1, isDraft: 0 },
        { name: "Lost", color: "#EF4444", sortOrder: 7, isDefault: 0, isClosed: 1, isDraft: 0 },
        { name: "Archive", color: "#64748B", sortOrder: 8, isDefault: 0, isClosed: 1, isDraft: 0 }
    ];
    for (const status of leadStatuses) {
        const existing = await client.query(
            "SELECT 1 FROM lead_statuses WHERE tenant_uid = $1 AND name = $2 AND is_deleted = 0",
            [tenantUid, status.name]
        );
        if (existing.rowCount === 0) {
            await client.query(
                `INSERT INTO lead_statuses (uid, tenant_uid, name, color, sort_order, is_default, is_closed, is_draft, created_by)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [uuidv4(), tenantUid, status.name, status.color, status.sortOrder, status.isDefault, status.isClosed, status.isDraft ?? 0, createdBy]
            );
        }
    }

    // 3. Seed Project Statuses
    const projectStatuses = [
        { name: "Not Started", color: "#9CA3AF", sortOrder: 1, isDefault: 1, isClosed: 0 },
        { name: "In Progress", color: "#3B82F6", sortOrder: 2, isDefault: 0, isClosed: 0 },
        { name: "Completed", color: "#10B981", sortOrder: 3, isDefault: 0, isClosed: 1 },
        { name: "On Hold", color: "#F59E0B", sortOrder: 4, isDefault: 0, isClosed: 0 },
        { name: "Cancelled", color: "#EF4444", sortOrder: 5, isDefault: 0, isClosed: 1 }
    ];

    await client.query(
        `UPDATE project_statuses ps
         SET name = 'Completed', updated_at = CURRENT_TIMESTAMP
         WHERE ps.tenant_uid = $1::uuid
           AND LOWER(TRIM(ps.name)) = 'commissioned'
           AND ps.is_deleted = 0
           AND NOT EXISTS (
               SELECT 1 FROM project_statuses existing
               WHERE existing.tenant_uid = ps.tenant_uid
                 AND LOWER(TRIM(existing.name)) = 'completed'
                 AND existing.is_deleted = 0
           )`,
        [tenantUid]
    );

    for (const status of projectStatuses) {
        const existing = await client.query(
            "SELECT 1 FROM project_statuses WHERE tenant_uid = $1::uuid AND name = $2 AND is_deleted = 0",
            [tenantUid, status.name]
        );
        if (existing.rowCount === 0) {
            await client.query(
                `INSERT INTO project_statuses (uid, tenant_uid, name, color, sort_order, is_default, is_closed, created_by)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [uuidv4(), tenantUid, status.name, status.color, status.sortOrder, status.isDefault, status.isClosed, tenantUid] 
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

    // 9. Seed Installation Milestones
    await seedInstallationMilestones(client, tenantUid, createdBy);

    // 10. Seed Workflow Automation Rules
    const defaultRules = [
        { key: 'FOLLOWUP_TO_CONTACTED', name: 'Auto-advance on Follow-up', desc: 'Automatically move lead from "New" to "Follow Up / Contacted" when first follow-up is scheduled.', sort: 1 },
        { key: 'SURVEY_TO_LEAD_STATUS', name: 'Auto-advance on Survey Completion', desc: 'Automatically move lead to "Site Survey Completed" when survey engineer submits roof measurements.', sort: 2 },
        { key: 'QUOTE_TO_LEAD_STATUS', name: 'Auto-advance on Quotation Sent', desc: 'Automatically move lead to "Quotation Sent" when a quotation PDF is generated and dispatched.', sort: 3 },
        { key: 'APPROVAL_TO_WON', name: 'Auto-advance to Won on Approval', desc: 'Automatically move lead to "Won" when a quotation is approved by the customer or manager.', sort: 4 },
        { key: 'APPROVAL_TO_PROJECT', name: 'Auto-create Project on Approval', desc: 'Automatically create a new Project with milestones and subsidy tracker when a quotation is approved.', sort: 5 },
        { key: 'PAYMENT_TO_IN_PROGRESS', name: 'Auto-start Project on Payment', desc: 'Automatically move project from "Not Started" to "In Progress" when an advance payment is recorded.', sort: 6 },
        { key: 'MILESTONES_TO_COMMISSIONED', name: 'Auto-complete on Completion', desc: 'Automatically move project to "Completed" when all 6 installation milestones are completed.', sort: 7 },
    ];
    for (const r of defaultRules) {
        const existing = await client.query(
            "SELECT 1 FROM workflow_automation_rules WHERE tenant_uid = $1 AND rule_key = $2",
            [tenantUid, r.key]
        );
        if (existing.rowCount === 0) {
            await client.query(
                `INSERT INTO workflow_automation_rules (uid, tenant_uid, rule_key, rule_name, description, is_enabled, sort_order, created_by)
                 VALUES ($1, $2, $3, $4, $5, 1, $6, $7)`,
                [uuidv4(), tenantUid, r.key, r.name, r.desc, r.sort, createdBy]
            );
        } else if (r.key === 'MILESTONES_TO_COMMISSIONED') {
            await client.query(
                `UPDATE workflow_automation_rules
                 SET rule_name = $3, description = $4, updated_at = CURRENT_TIMESTAMP
                 WHERE tenant_uid = $1 AND rule_key = $2`,
                [tenantUid, r.key, r.name, r.desc]
            );
        }
    }

    logger.info(`✅ Seeded tenant defaults for tenant: ${tenantUid} successfully!`);
}

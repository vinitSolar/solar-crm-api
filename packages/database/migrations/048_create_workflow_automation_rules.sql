-- ============================================================
-- Create workflow_automation_rules table for per-tenant toggle
-- ============================================================

CREATE TABLE IF NOT EXISTS workflow_automation_rules (
    id              BIGSERIAL PRIMARY KEY,
    uid             VARCHAR(255) NOT NULL DEFAULT gen_random_uuid()::varchar UNIQUE,
    tenant_uid      VARCHAR(255) NOT NULL,
    rule_key        VARCHAR(100) NOT NULL,
    rule_name       VARCHAR(255) NOT NULL,
    description     TEXT,
    is_enabled      SMALLINT NOT NULL DEFAULT 1,
    sort_order      INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    CONSTRAINT uq_war_tenant_rule UNIQUE(tenant_uid, rule_key)
);

CREATE INDEX IF NOT EXISTS idx_war_tenant_uid ON workflow_automation_rules(tenant_uid);

-- Seed default rules for all existing tenants
INSERT INTO workflow_automation_rules (tenant_uid, rule_key, rule_name, description, is_enabled, sort_order, created_by)
SELECT 
    t.uid,
    r.rule_key,
    r.rule_name,
    r.description,
    1,
    r.sort_order,
    t.uid
FROM 
    (SELECT uid FROM tenants WHERE is_deleted = 0) t
CROSS JOIN (
    VALUES 
        ('FOLLOWUP_TO_CONTACTED',      'Auto-advance on Follow-up',           'Automatically move lead from "New" to "Follow Up / Contacted" when first follow-up is scheduled.',     1),
        ('SURVEY_TO_LEAD_STATUS',      'Auto-advance on Survey Completion',   'Automatically move lead to "Site Survey Completed" when survey engineer submits roof measurements.',  2),
        ('QUOTE_TO_LEAD_STATUS',       'Auto-advance on Quotation Sent',      'Automatically move lead to "Quotation Sent" when a quotation PDF is generated and dispatched.',        3),
        ('APPROVAL_TO_WON',            'Auto-advance to Won on Approval',     'Automatically move lead to "Won" when a quotation is approved by the customer or manager.',           4),
        ('APPROVAL_TO_PROJECT',        'Auto-create Project on Approval',     'Automatically create a new Project with milestones and subsidy tracker when a quotation is approved.', 5),
        ('PAYMENT_TO_IN_PROGRESS',     'Auto-start Project on Payment',       'Automatically move project from "Not Started" to "In Progress" when an advance payment is recorded.', 6),
        ('MILESTONES_TO_COMMISSIONED', 'Auto-commission on Completion',       'Automatically move project to "Commissioned" when all 6 installation milestones are completed.',      7)
) AS r(rule_key, rule_name, description, sort_order)
WHERE NOT EXISTS (
    SELECT 1 FROM workflow_automation_rules war 
    WHERE war.tenant_uid = t.uid AND war.rule_key = r.rule_key
);

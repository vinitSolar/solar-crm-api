-- Migration 032: Add is_draft column to lead_statuses table
-- Default is 0
-- 1 indicates the status represents a Draft lead
ALTER TABLE lead_statuses ADD COLUMN IF NOT EXISTS is_draft SMALLINT DEFAULT 0;

-- If any lead status is already named 'Draft', mark it as is_draft = 1
UPDATE lead_statuses 
SET is_draft = 1 
WHERE LOWER(name) = 'draft';

-- Insert 'Draft' status for any existing tenants that do not have one
INSERT INTO lead_statuses (uid, tenant_uid, name, color, sort_order, is_default, is_closed, is_draft, created_by)
SELECT 
    gen_random_uuid()::varchar, 
    t.uid, 
    'Draft', 
    '#94A3B8', 
    0, 
    0, 
    0, 
    1, 
    'SYSTEM'
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM lead_statuses ls 
    WHERE ls.tenant_uid = t.uid 
      AND (ls.is_draft = 1 OR LOWER(ls.name) = 'draft')
      AND ls.is_deleted = 0
);

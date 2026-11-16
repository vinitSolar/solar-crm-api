-- Migration 045: Add is_follow_up to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_follow_up SMALLINT DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_leads_is_follow_up ON leads (is_follow_up);
UPDATE leads SET is_follow_up = 1 WHERE follow_up_date IS NOT NULL;


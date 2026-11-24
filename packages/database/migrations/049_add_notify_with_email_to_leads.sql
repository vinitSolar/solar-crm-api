-- Migration 049: Add notify_with_email to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS notify_with_email SMALLINT DEFAULT 0;

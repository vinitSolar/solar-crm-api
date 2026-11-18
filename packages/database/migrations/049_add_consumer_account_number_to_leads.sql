-- Add consumer_account_number column to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS consumer_account_number VARCHAR(100) DEFAULT NULL;

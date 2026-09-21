-- Add landmark column to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS landmark VARCHAR(500) DEFAULT NULL;

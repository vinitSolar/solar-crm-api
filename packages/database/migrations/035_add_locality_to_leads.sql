-- Migration 035: Add locality column to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS locality VARCHAR(500) DEFAULT NULL;

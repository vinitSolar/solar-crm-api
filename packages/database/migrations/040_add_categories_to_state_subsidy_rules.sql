-- Migration 040: Add categories column to state_subsidy_rules table
ALTER TABLE state_subsidy_rules ADD COLUMN IF NOT EXISTS categories INTEGER[] DEFAULT '{1,2,3,4}';
UPDATE state_subsidy_rules SET categories = '{1,2,3,4}' WHERE categories IS NULL;


-- Migration 034: Allow null values in leads table for draft leads
ALTER TABLE leads ALTER COLUMN mobile_number DROP NOT NULL;
ALTER TABLE leads ALTER COLUMN state DROP NOT NULL;
ALTER TABLE leads ALTER COLUMN city DROP NOT NULL;
ALTER TABLE leads ALTER COLUMN lead_source_uid DROP NOT NULL;

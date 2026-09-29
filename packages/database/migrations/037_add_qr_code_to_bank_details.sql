-- Migration 037: Add qr_code column to bank_details table
ALTER TABLE bank_details ADD COLUMN IF NOT EXISTS qr_code VARCHAR(255);

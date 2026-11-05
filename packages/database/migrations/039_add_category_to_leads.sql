-- Migration 039: Add category column to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS category SMALLINT DEFAULT 1;

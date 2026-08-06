-- Add latitude and longitude columns to site_surveys table
ALTER TABLE site_surveys ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 7) NULL;
ALTER TABLE site_surveys ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7) NULL;

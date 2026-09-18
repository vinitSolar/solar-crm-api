-- Migration 031: Add show_all_surveys column to roles table
-- Default is 0 (show only surveys assigned to user)
-- 1 indicates user can view all surveys within their tenant
ALTER TABLE roles ADD COLUMN IF NOT EXISTS show_all_surveys SMALLINT DEFAULT 0;

-- Update Head Office (Master) role to have show_all_surveys = 1
UPDATE roles 
SET show_all_surveys = 1 
WHERE name = 'Master';

-- Update Franchise Owner(Admin) role to have show_all_surveys = 1
UPDATE roles 
SET show_all_surveys = 1 
WHERE name = 'Franchise Owner(Admin)';

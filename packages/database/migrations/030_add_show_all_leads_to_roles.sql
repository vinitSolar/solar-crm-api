-- Migration 030: Add show_all_leads column to roles table
-- Default is 0 (show only leads assigned to user)
-- 1 indicates user can view all leads within their tenant
ALTER TABLE roles ADD COLUMN IF NOT EXISTS show_all_leads SMALLINT DEFAULT 0;

-- Update Head Office (Master) role to have show_all_leads = 1
UPDATE roles
SET show_all_leads = 1
WHERE name = 'Master';

-- Update Franchise Owner(Admin) role to have show_all_leads = 1
UPDATE roles
SET show_all_leads = 1
WHERE name = 'Franchise Owner(Admin)';

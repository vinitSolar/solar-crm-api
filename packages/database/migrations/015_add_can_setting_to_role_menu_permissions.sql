-- =============================================
-- Migration: Add can_setting to role_menu_permissions
-- =============================================

BEGIN;

ALTER TABLE role_menu_permissions 
ADD COLUMN IF NOT EXISTS can_setting SMALLINT DEFAULT 0;

ALTER TABLE user_menu_permissions 
ADD COLUMN IF NOT EXISTS can_setting SMALLINT DEFAULT 0;

COMMIT;

-- Migration 029: Grant USERS view permission to all franchise roles
-- Ensures all franchise roles can view users (for team visibility, dropdowns, and filters)

-- 1. Ensure Franchise Owner(Admin) has full permission on USERS
UPDATE role_menu_permissions rmp
SET can_view = 1, can_create = 1, can_edit = 1, can_delete = 1, can_setting = 1
FROM roles r
JOIN tenants t ON t.uid = r.tenant_uid AND t.type != 0 AND t.is_deleted = 0
JOIN menus m ON UPPER(m.code) = 'USERS'
WHERE rmp.role_uid = r.uid
  AND rmp.tenant_uid = r.tenant_uid
  AND rmp.menu_uid = m.uid
  AND r.name = 'Franchise Owner(Admin)';

-- 2. Update existing role_menu_permissions records for non-owner franchise roles to have can_view = 1 on USERS
UPDATE role_menu_permissions rmp
SET can_view = 1
FROM roles r
JOIN tenants t ON t.uid = r.tenant_uid AND t.type != 0 AND t.is_deleted = 0
JOIN menus m ON UPPER(m.code) = 'USERS'
WHERE rmp.role_uid = r.uid
  AND rmp.tenant_uid = r.tenant_uid
  AND rmp.menu_uid = m.uid
  AND r.name != 'Franchise Owner(Admin)';

-- 3. Insert missing permission records for franchise roles on USERS menu
INSERT INTO role_menu_permissions (tenant_uid, role_uid, menu_uid, can_view, can_create, can_edit, can_delete, can_setting)
SELECT 
    r.tenant_uid,
    r.uid AS role_uid,
    m.uid AS menu_uid,
    1 AS can_view,
    CASE WHEN r.name = 'Franchise Owner(Admin)' THEN 1 ELSE 0 END AS can_create,
    CASE WHEN r.name = 'Franchise Owner(Admin)' THEN 1 ELSE 0 END AS can_edit,
    CASE WHEN r.name = 'Franchise Owner(Admin)' THEN 1 ELSE 0 END AS can_delete,
    CASE WHEN r.name = 'Franchise Owner(Admin)' THEN 1 ELSE 0 END AS can_setting
FROM roles r
JOIN tenants t ON t.uid = r.tenant_uid AND t.type != 0 AND t.is_deleted = 0
CROSS JOIN menus m
WHERE UPPER(m.code) = 'USERS'
AND m.is_active = 1
AND NOT EXISTS (
    SELECT 1 FROM role_menu_permissions rmp
    WHERE rmp.tenant_uid = r.tenant_uid 
      AND rmp.role_uid = r.uid 
      AND rmp.menu_uid = m.uid
);

-- Migration 044: Add Follow Ups menu and grant access to canSale users and Sales Executives
INSERT INTO menus (uid, name, code, route, icon, sort_order, is_active)
VALUES (gen_random_uuid()::varchar, 'Follow Ups', 'FOLLOW_UPS', '/follow-ups', 'CalendarClock', 15, 1)
ON CONFLICT (code) DO NOTHING;

-- Clean existing permissions for FOLLOW_UPS if any, then insert fresh permissions
DELETE FROM role_menu_permissions rmp
USING menus m
WHERE rmp.menu_uid = m.uid
  AND UPPER(m.code) = 'FOLLOW_UPS';

INSERT INTO role_menu_permissions (tenant_uid, role_uid, menu_uid, can_view, can_create, can_edit, can_delete, can_setting)
SELECT 
    r.tenant_uid,
    r.uid AS role_uid,
    m.uid AS menu_uid,
    CASE 
        WHEN COALESCE(r.can_sale, 0) = 1 OR LOWER(TRIM(r.name)) IN ('sales executive', 'franchise owner(admin)', 'master') THEN 1 
        ELSE 0 
    END AS can_view,
    CASE 
        WHEN COALESCE(r.can_sale, 0) = 1 OR LOWER(TRIM(r.name)) IN ('sales executive', 'franchise owner(admin)', 'master') THEN 1 
        ELSE 0 
    END AS can_create,
    CASE 
        WHEN COALESCE(r.can_sale, 0) = 1 OR LOWER(TRIM(r.name)) IN ('sales executive', 'franchise owner(admin)', 'master') THEN 1 
        ELSE 0 
    END AS can_edit,
    0 AS can_delete,
    0 AS can_setting
FROM roles r
CROSS JOIN menus m
WHERE UPPER(m.code) = 'FOLLOW_UPS'
  AND r.is_deleted = 0;

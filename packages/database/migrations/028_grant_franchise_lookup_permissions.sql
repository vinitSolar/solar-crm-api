-- Migration 028: Grant master lookup read permissions to all franchise roles
-- Ensures all existing franchise roles have can_view: 1 for status and lookup master data.

-- 1. Update existing permission records for franchise roles
UPDATE role_menu_permissions rmp
SET can_view = 1
FROM roles r
JOIN tenants t ON t.uid = r.tenant_uid AND t.type != 0 AND t.is_deleted = 0
JOIN menus m ON UPPER(m.code) IN (
    'DOCUMENT_TYPES',
    'INSTALLATION_MILESTONES',
    'LEAD_SOURCES',
    'LEAD_STATUSES',
    'PRODUCT_BRANDS',
    'PRODUCT_CATEGORIES',
    'PRODUCT_SPECIFICATIONS',
    'PRODUCT_UNITS',
    'PROJECT_STATUSES',
    'QUOTATION_MASTERS',
    'QUOTATION_TERMS',
    'QUOTATION_SCOPE',
    'STATE_SUBSIDY_RULES',
    'SUBSIDY_DOCUMENT_TYPES',
    'BANK_DETAILS',
    'SUBSIDIES'
)
WHERE rmp.role_uid = r.uid
  AND rmp.tenant_uid = r.tenant_uid
  AND rmp.menu_uid = m.uid;

-- 2. Insert missing permission records for franchise roles
INSERT INTO role_menu_permissions (tenant_uid, role_uid, menu_uid, can_view, can_create, can_edit, can_delete, can_setting)
SELECT 
    r.tenant_uid,
    r.uid AS role_uid,
    m.uid AS menu_uid,
    1 AS can_view,
    0 AS can_create,
    0 AS can_edit,
    0 AS can_delete,
    0 AS can_setting
FROM roles r
JOIN tenants t ON t.uid = r.tenant_uid AND t.type != 0 AND t.is_deleted = 0
CROSS JOIN menus m
WHERE UPPER(m.code) IN (
    'DOCUMENT_TYPES',
    'INSTALLATION_MILESTONES',
    'LEAD_SOURCES',
    'LEAD_STATUSES',
    'PRODUCT_BRANDS',
    'PRODUCT_CATEGORIES',
    'PRODUCT_SPECIFICATIONS',
    'PRODUCT_UNITS',
    'PROJECT_STATUSES',
    'QUOTATION_MASTERS',
    'QUOTATION_TERMS',
    'QUOTATION_SCOPE',
    'STATE_SUBSIDY_RULES',
    'SUBSIDY_DOCUMENT_TYPES',
    'BANK_DETAILS',
    'SUBSIDIES'
)
AND m.is_active = 1
AND NOT EXISTS (
    SELECT 1 FROM role_menu_permissions rmp
    WHERE rmp.tenant_uid = r.tenant_uid 
      AND rmp.role_uid = r.uid 
      AND rmp.menu_uid = m.uid
);

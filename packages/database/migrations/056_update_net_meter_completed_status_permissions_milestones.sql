-- ============================================================================
-- Migration 056:
-- 1. Net meter status simplified to Pending (0) and Completed (1)
-- 2. Project status 'Commissioned' renamed to 'Completed'
-- 3. Any role/user with 'projects' permission receives 'subsidy_tracker' permission
-- 4. Seed default installation_milestones for existing franchises and grant
--    Franchise Owner(Admin) manage/settings permissions for installation_milestones
-- ============================================================================

-- 1. Net meter status: map legacy 6 (COMPLETED) -> 1 (COMPLETED), all others -> 0 (PENDING)
UPDATE subsidy_trackers
SET net_meter_status = CASE WHEN net_meter_status = 6 THEN 1 ELSE 0 END;

ALTER TABLE subsidy_trackers ALTER COLUMN net_meter_status SET DEFAULT 0;
COMMENT ON COLUMN subsidy_trackers.net_meter_status IS '0: PENDING, 1: COMPLETED';

-- 2. Rename project status 'Commissioned' -> 'Completed' where 'Completed' doesn't already exist
UPDATE project_statuses ps
SET name = 'Completed',
    updated_at = CURRENT_TIMESTAMP
WHERE LOWER(TRIM(ps.name)) = 'commissioned'
  AND ps.is_deleted = 0
  AND NOT EXISTS (
      SELECT 1 FROM project_statuses existing
      WHERE existing.tenant_uid = ps.tenant_uid
        AND LOWER(TRIM(existing.name)) = 'completed'
        AND existing.is_deleted = 0
  );

UPDATE workflow_automation_rules
SET rule_name = 'Auto-complete on Completion',
    description = 'Automatically move project to "Completed" when all 6 installation milestones are completed.',
    updated_at = CURRENT_TIMESTAMP
WHERE rule_key = 'MILESTONES_TO_COMMISSIONED';

-- 3. Sync 'projects' permissions -> 'subsidy_tracker' permissions for roles and users
UPDATE role_menu_permissions rmp_sub
SET can_view = GREATEST(rmp_sub.can_view, rmp_proj.can_view),
    can_create = GREATEST(rmp_sub.can_create, rmp_proj.can_create),
    can_edit = GREATEST(rmp_sub.can_edit, rmp_proj.can_edit),
    can_delete = GREATEST(rmp_sub.can_delete, rmp_proj.can_delete)
FROM role_menu_permissions rmp_proj,
     menus m_proj,
     menus m_sub
WHERE LOWER(m_proj.code) = 'projects'
  AND LOWER(m_sub.code) = 'subsidy_tracker'
  AND rmp_proj.menu_uid = m_proj.uid
  AND rmp_sub.menu_uid = m_sub.uid
  AND rmp_sub.tenant_uid = rmp_proj.tenant_uid
  AND rmp_sub.role_uid = rmp_proj.role_uid
  AND (rmp_proj.can_view = 1 OR rmp_proj.can_create = 1 OR rmp_proj.can_edit = 1 OR rmp_proj.can_delete = 1);

INSERT INTO role_menu_permissions (tenant_uid, role_uid, menu_uid, can_view, can_create, can_edit, can_delete, can_setting)
SELECT rmp_proj.tenant_uid, rmp_proj.role_uid, m_sub.uid,
       rmp_proj.can_view, rmp_proj.can_create, rmp_proj.can_edit, rmp_proj.can_delete, 0
FROM role_menu_permissions rmp_proj
JOIN menus m_proj ON m_proj.uid = rmp_proj.menu_uid AND LOWER(m_proj.code) = 'projects'
CROSS JOIN menus m_sub
WHERE LOWER(m_sub.code) = 'subsidy_tracker'
  AND (rmp_proj.can_view = 1 OR rmp_proj.can_create = 1 OR rmp_proj.can_edit = 1 OR rmp_proj.can_delete = 1)
  AND NOT EXISTS (
      SELECT 1 FROM role_menu_permissions existing
      WHERE existing.tenant_uid = rmp_proj.tenant_uid
        AND existing.role_uid = rmp_proj.role_uid
        AND existing.menu_uid = m_sub.uid
  );

UPDATE user_menu_permissions ump_sub
SET can_view = GREATEST(ump_sub.can_view, ump_proj.can_view),
    can_create = GREATEST(ump_sub.can_create, ump_proj.can_create),
    can_edit = GREATEST(ump_sub.can_edit, ump_proj.can_edit),
    can_delete = GREATEST(ump_sub.can_delete, ump_proj.can_delete)
FROM user_menu_permissions ump_proj,
     menus m_proj,
     menus m_sub
WHERE LOWER(m_proj.code) = 'projects'
  AND LOWER(m_sub.code) = 'subsidy_tracker'
  AND ump_proj.menu_uid = m_proj.uid
  AND ump_sub.menu_uid = m_sub.uid
  AND ump_sub.tenant_uid = ump_proj.tenant_uid
  AND ump_sub.user_uid = ump_proj.user_uid
  AND (ump_proj.can_view = 1 OR ump_proj.can_create = 1 OR ump_proj.can_edit = 1 OR ump_proj.can_delete = 1);

INSERT INTO user_menu_permissions (tenant_uid, user_uid, menu_uid, can_view, can_create, can_edit, can_delete, can_setting)
SELECT ump_proj.tenant_uid, ump_proj.user_uid, m_sub.uid,
       ump_proj.can_view, ump_proj.can_create, ump_proj.can_edit, ump_proj.can_delete, 0
FROM user_menu_permissions ump_proj
JOIN menus m_proj ON m_proj.uid = ump_proj.menu_uid AND LOWER(m_proj.code) = 'projects'
CROSS JOIN menus m_sub
WHERE LOWER(m_sub.code) = 'subsidy_tracker'
  AND (ump_proj.can_view = 1 OR ump_proj.can_create = 1 OR ump_proj.can_edit = 1 OR ump_proj.can_delete = 1)
  AND NOT EXISTS (
      SELECT 1 FROM user_menu_permissions existing
      WHERE existing.tenant_uid = ump_proj.tenant_uid
        AND existing.user_uid = ump_proj.user_uid
        AND existing.menu_uid = m_sub.uid
  );

-- 4. Seed default installation milestones for all active franchise tenants
INSERT INTO installation_milestones (
    uid, tenant_uid, name, description, sort_order, requires_document, allow_multiple_images, is_system, is_active, is_deleted, created_by
)
SELECT
    gen_random_uuid()::varchar,
    t.uid,
    m.name,
    m.description,
    m.sort_order,
    1,
    1,
    1,
    1,
    0,
    'SYSTEM'
FROM tenants t
CROSS JOIN (
    VALUES
        ('Material delivered to site', 'Delivery and site verification of solar modules, inverter, structure, and BOS materials', 1),
        ('DISCOM inspection application submitted', 'Submission of work completion report and DISCOM inspection application', 2),
        ('DISCOM inspection passed', 'Physical inspection, earth resistance test, and clearance by DISCOM engineers', 3),
        ('Net meter passed', 'Bidirectional net meter testing, installation, sealing, and grid synchronization', 4),
        ('Subsidy application submitted', 'Commissioning certificate and subsidy claim submission on national / state portal', 5),
        ('Subsidy disbursed', 'Subsidy approved and released directly into the customer''s bank account', 6)
) AS m(name, description, sort_order)
WHERE t.type != 0
  AND t.is_deleted = 0
  AND NOT EXISTS (
      SELECT 1 FROM installation_milestones im
      WHERE im.tenant_uid::varchar = t.uid
        AND LOWER(TRIM(im.name)) = LOWER(TRIM(m.name))
        AND im.is_deleted = 0
  );

-- Grant Franchise Owner(Admin) full permissions for installation_milestones so it is visible and manageable
UPDATE role_menu_permissions rmp
SET can_view = 1, can_create = 1, can_edit = 1, can_delete = 1, can_setting = 1
FROM roles r, tenants t, menus m
WHERE rmp.role_uid = r.uid
  AND rmp.tenant_uid = r.tenant_uid
  AND r.tenant_uid = t.uid
  AND rmp.menu_uid = m.uid
  AND t.type != 0
  AND t.is_deleted = 0
  AND r.is_deleted = 0
  AND LOWER(TRIM(r.name)) = 'franchise owner(admin)'
  AND LOWER(m.code) = 'installation_milestones';

INSERT INTO role_menu_permissions (tenant_uid, role_uid, menu_uid, can_view, can_create, can_edit, can_delete, can_setting)
SELECT r.tenant_uid, r.uid, m.uid, 1, 1, 1, 1, 1
FROM roles r
JOIN tenants t ON t.uid = r.tenant_uid AND t.type != 0 AND t.is_deleted = 0
CROSS JOIN menus m
WHERE r.is_deleted = 0
  AND LOWER(TRIM(r.name)) = 'franchise owner(admin)'
  AND LOWER(m.code) = 'installation_milestones'
  AND NOT EXISTS (
      SELECT 1 FROM role_menu_permissions existing
      WHERE existing.tenant_uid = r.tenant_uid
        AND existing.role_uid = r.uid
        AND existing.menu_uid = m.uid
  );

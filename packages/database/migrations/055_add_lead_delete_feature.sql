-- =============================================
-- Migration: 055_add_lead_delete_feature.sql
-- Description: Adds 'lead_delete' feature permission for dynamic, database-driven feature-based access control.
-- =============================================

DO $$
DECLARE
    v_menu_uid VARCHAR(255);
    v_feature_uid VARCHAR(255) := '42345678-0000-0000-0000-000000000004';
BEGIN
    -- 1. Find Leads menu UID
    SELECT uid::varchar INTO v_menu_uid FROM menus WHERE LOWER(code) = 'leads' LIMIT 1;

    IF v_menu_uid IS NOT NULL THEN
        -- 2. Insert feature if not exists
        IF NOT EXISTS (SELECT 1 FROM features WHERE LOWER(code) = 'lead_delete') THEN
            INSERT INTO features (uid, menu_uid, name, code, is_active, created_at, updated_at)
            VALUES (v_feature_uid, v_menu_uid, 'Delete Lead', 'lead_delete', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
        END IF;

        -- 3. Populate role_feature_permissions for roles that have delete access on LEADS
        INSERT INTO role_feature_permissions (tenant_uid, role_uid, feature_uid, is_enabled)
        SELECT 
            rmp.tenant_uid,
            rmp.role_uid,
            f.uid,
            1
        FROM role_menu_permissions rmp
        JOIN menus m ON m.uid = rmp.menu_uid AND LOWER(m.code) = 'leads'
        CROSS JOIN features f
        WHERE LOWER(f.code) = 'lead_delete'
          AND rmp.can_delete = 1
          AND NOT EXISTS (
              SELECT 1 FROM role_feature_permissions existing
              WHERE existing.tenant_uid = rmp.tenant_uid 
                AND existing.role_uid = rmp.role_uid 
                AND existing.feature_uid = f.uid
          );
    END IF;
END $$;

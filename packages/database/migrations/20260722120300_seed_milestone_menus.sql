BEGIN;

DO $$ 
DECLARE
    v_tenant_uid VARCHAR(255);
    v_admin_role_uid VARCHAR(255);
    v_menu_uid VARCHAR(255) := 'a429a1dc-bbbb-4d78-9040-5e3fc1400000'; -- Unique UID for this menu
    v_feature_view_uid VARCHAR(255) := 'b819a1dc-bbbb-4d78-9040-5e3fc1400001';
    v_feature_create_uid VARCHAR(255) := 'c719a1dc-bbbb-4d78-9040-5e3fc1400002';
    v_feature_edit_uid VARCHAR(255) := 'd619a1dc-bbbb-4d78-9040-5e3fc1400003';
    v_feature_delete_uid VARCHAR(255) := 'e519a1dc-bbbb-4d78-9040-5e3fc1400004';
BEGIN
    -- Create Menu (Global)
    INSERT INTO menus (uid, name, code, route, icon, sort_order, parent_uid, is_active, created_at, updated_at)
    VALUES (v_menu_uid, 'Installation Milestones', 'installation_milestones', '/settings/installation-milestones', 'CheckSquare', 50, NULL, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (uid) DO NOTHING;
    
    -- Create Features (Global)
    INSERT INTO features (uid, menu_uid, name, code, is_active, created_at, updated_at)
    VALUES 
        (v_feature_view_uid, v_menu_uid, 'View', 'view_installation_milestones', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (v_feature_create_uid, v_menu_uid, 'Create', 'create_installation_milestones', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (v_feature_edit_uid, v_menu_uid, 'Edit', 'edit_installation_milestones', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (v_feature_delete_uid, v_menu_uid, 'Delete', 'delete_installation_milestones', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (uid) DO NOTHING;

    -- Grant Permissions per Tenant
    FOR v_tenant_uid, v_admin_role_uid IN 
        SELECT t.uid, r.uid 
        FROM tenants t
        JOIN roles r ON r.tenant_uid = t.uid AND r.name = 'Super Admin'
    LOOP
        -- Grant Menu Permission
        INSERT INTO role_menu_permissions (uid, tenant_uid, role_uid, menu_uid, can_view)
        VALUES (md5(random()::text), v_tenant_uid, v_admin_role_uid, v_menu_uid, 1)
        ON CONFLICT DO NOTHING;
        
        -- Grant Feature Permissions
        INSERT INTO role_feature_permissions (uid, tenant_uid, role_uid, feature_uid, can_access)
        VALUES 
            (md5(random()::text), v_tenant_uid, v_admin_role_uid, v_feature_view_uid, 1),
            (md5(random()::text), v_tenant_uid, v_admin_role_uid, v_feature_create_uid, 1),
            (md5(random()::text), v_tenant_uid, v_admin_role_uid, v_feature_edit_uid, 1),
            (md5(random()::text), v_tenant_uid, v_admin_role_uid, v_feature_delete_uid, 1)
        ON CONFLICT DO NOTHING;
    END LOOP;
END $$;

COMMIT;

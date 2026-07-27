BEGIN;

DO $$
DECLARE
    v_menu_uid VARCHAR(255) := gen_random_uuid();
    v_ho_tenant_uid VARCHAR(255);
    v_master_role_uid VARCHAR(255);
    v_admin_user_uid VARCHAR(255);
BEGIN
    -- 1. Insert Menu
    INSERT INTO menus (uid, name, code, route, icon, sort_order, is_active)
    VALUES (v_menu_uid, 'Product Specifications', 'PRODUCT_SPECIFICATIONS', '/product-specifications', 'List', 7, 1)
    ON CONFLICT (code) DO NOTHING;

    -- Get the actual UID if it already existed (though we just generated it, ON CONFLICT might skip insert)
    SELECT uid INTO v_menu_uid FROM menus WHERE code = 'PRODUCT_SPECIFICATIONS';

    -- 2. Get Head Office Tenant
    SELECT uid INTO v_ho_tenant_uid FROM tenants WHERE code = 'HO' AND is_deleted = 0 LIMIT 1;
    
    -- 3. Get Master Role
    IF v_ho_tenant_uid IS NOT NULL THEN
        SELECT uid INTO v_master_role_uid FROM roles WHERE name = 'Master' AND tenant_uid = v_ho_tenant_uid LIMIT 1;
        
        IF v_master_role_uid IS NOT NULL AND v_menu_uid IS NOT NULL THEN
            -- Grant permissions to Master role
            INSERT INTO role_menu_permissions (tenant_uid, role_uid, menu_uid, can_view, can_create, can_edit, can_delete)
            VALUES (v_ho_tenant_uid, v_master_role_uid, v_menu_uid, 1, 1, 1, 1)
            ON CONFLICT DO NOTHING;
        END IF;

        -- 4. Get Admin User
        SELECT uid INTO v_admin_user_uid FROM users WHERE email = 'admin@sunselect.com' AND tenant_uid = v_ho_tenant_uid LIMIT 1;
        
        IF v_admin_user_uid IS NOT NULL AND v_menu_uid IS NOT NULL THEN
            -- Grant permissions to Admin user
            INSERT INTO user_menu_permissions (tenant_uid, user_uid, menu_uid, can_view, can_create, can_edit, can_delete)
            VALUES (v_ho_tenant_uid, v_admin_user_uid, v_menu_uid, 1, 1, 1, 1)
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;

END $$;

COMMIT;

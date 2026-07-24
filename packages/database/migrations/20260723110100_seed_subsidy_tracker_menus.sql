BEGIN;

-- Insert Subsidy Tracker Menu
INSERT INTO menus (uid, name, code, route, icon, parent_uid, sort_order, is_active, created_at, updated_at)
SELECT 
    '0a2948ca-13f5-48b4-9da2-a38f32dafc2d',
    'Subsidy Tracker',
    'subsidy_tracker',
    '/subsidy-trackers',
    'subsidy-tracker',
    NULL,
    9,
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM menus WHERE uid = '0a2948ca-13f5-48b4-9da2-a38f32dafc2d'
);

-- Insert Feature Permissions for Subsidy Tracker
INSERT INTO features (uid, menu_uid, name, code, is_active, created_at, updated_at)
SELECT 
    f.uid,
    m.uid,
    f.name,
    f.code,
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM (VALUES 
    ('680f4f95-1f9e-4a6c-9403-ef6a438258dc', 'Upload Documents', 'subsidy_tracker_upload_documents'),
    ('397f39ca-f1bc-4c31-92be-9da35bb3d07e', 'Export', 'subsidy_tracker_export'),
    ('fc31bb7c-2b22-4217-ba0e-a6190bf03e9c', 'Update Financials', 'subsidy_tracker_update_financials')
) AS f(uid, name, code)
CROSS JOIN menus m
WHERE m.uid = '0a2948ca-13f5-48b4-9da2-a38f32dafc2d'
AND NOT EXISTS (
    SELECT 1 FROM features WHERE features.uid = f.uid
);

COMMIT;

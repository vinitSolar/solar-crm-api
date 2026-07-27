BEGIN;

-- Insert Packages Menu
INSERT INTO menus (uid, name, code, route, icon, parent_uid, sort_order, is_active, created_at, updated_at)
SELECT 
    '2300b91f-5fc0-4a82-95f2-95d181057c74',
    'Packages',
    'packages',
    '/packages',
    'package',
    NULL,
    10,
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM menus WHERE uid = '2300b91f-5fc0-4a82-95f2-95d181057c74'
);

-- Insert Feature Permissions for Packages
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
    ('7cc3a5de-80df-4f40-b6ab-1d38260b0d36', 'Export', 'packages_export'),
    ('9eab0044-c6a6-455b-add6-d3c26786e680', 'Duplicate Package', 'packages_duplicate')
) AS f(uid, name, code)
CROSS JOIN menus m
WHERE m.uid = '2300b91f-5fc0-4a82-95f2-95d181057c74'
AND NOT EXISTS (
    SELECT 1 FROM features WHERE features.uid = f.uid
);

COMMIT;

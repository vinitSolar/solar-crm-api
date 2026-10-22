-- Migration 038: Mark default seeded franchise roles as system roles
UPDATE roles 
SET is_system = 1 
WHERE name IN (
    'Franchise Owner(Admin)', 
    'Sales Executive', 
    'Survey Engineer', 
    'Backoffice', 
    'Warehouse / Procurement', 
    'Installer',
    'Master'
);

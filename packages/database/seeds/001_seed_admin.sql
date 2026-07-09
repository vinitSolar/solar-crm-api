-- =============================================
-- Seed: Initial Admin Setup
-- =============================================
-- Creates:
--   1. Head Office Tenant (type = 0)
--   2. Master Role (system role)
--   3. Admin User (admin@sunselect.com / Admin@123)
--
-- NOTE: This SQL uses gen_random_uuid() (PostgreSQL 13+).
--       For runtime bcrypt hashing, use the TypeScript
--       seed runner instead: npm run db:seed
-- =============================================

BEGIN;

-- =============================================
-- 1. Tenant: Head Office
-- =============================================
INSERT INTO tenants (uid, code, name, type, email, timezone, is_active, is_deleted, created_by)
VALUES (
    gen_random_uuid()::VARCHAR,
    'HO',
    'SunSelect Solar India',
    0,              -- Head Office
    'admin@sunselect.com',
    'Asia/Kolkata',
    1,              -- Active
    0,              -- Not Deleted
    'SYSTEM'
)
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- 2. Role: Master (System Role)
-- =============================================
INSERT INTO roles (uid, tenant_uid, name, description, is_system, is_active, is_deleted, created_by)
VALUES (
    gen_random_uuid()::VARCHAR,
    (SELECT uid FROM tenants WHERE code = 'HO'),
    'Master',
    'Super administrator role with full system access. This is a system-defined role and cannot be modified or deleted.',
    1,              -- System Role
    1,              -- Active
    0,              -- Not Deleted
    'SYSTEM'
)
ON CONFLICT (uid) DO NOTHING;

-- =============================================
-- 3. User: Admin
-- =============================================
-- Password: Admin@123
-- NOTE: Use the TypeScript seed runner (npm run db:seed)
--       for proper bcrypt hashing at runtime.
INSERT INTO users (uid, tenant_uid, role_uid, first_name, last_name, email, password, is_active, is_deleted, created_by)
VALUES (
    gen_random_uuid()::VARCHAR,
    (SELECT uid FROM tenants WHERE code = 'HO'),
    (SELECT uid FROM roles WHERE tenant_uid = (SELECT uid FROM tenants WHERE code = 'HO') AND name = 'Master'),
    'Admin',
    'User',
    'admin@sunselect.com',
    '$2b$10$PLACEHOLDER_USE_TS_SEED_RUNNER',
    1,              -- Active
    0,              -- Not Deleted
    'SYSTEM'
)
ON CONFLICT (email) DO NOTHING;

-- =============================================
-- 4. Default Menus
-- =============================================
INSERT INTO menus (uid, name, code, route, icon, sort_order, is_active)
VALUES 
    (gen_random_uuid()::VARCHAR, 'Dashboard', 'DASHBOARD', '/dashboard', 'LayoutDashboard', 1, 1),
    (gen_random_uuid()::VARCHAR, 'Leads', 'LEADS', '/leads', 'Users', 2, 1),
    (gen_random_uuid()::VARCHAR, 'Surveys', 'SURVEYS', '/surveys', 'ClipboardList', 3, 1),
    (gen_random_uuid()::VARCHAR, 'Quotations', 'QUOTATIONS', '/quotations', 'FileText', 4, 1)
ON CONFLICT (code) DO NOTHING;

COMMIT;

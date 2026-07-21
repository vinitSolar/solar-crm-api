-- Seed Project Menus
INSERT INTO menus (uid, name, code, route, icon, sort_order, parent_uid, is_active, created_at, updated_at)
VALUES 
  ('12345678-0000-0000-0000-000000000001', 'Projects', 'projects', '/projects', 'briefcase', 4, NULL, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Seed Project Features
INSERT INTO features (uid, menu_uid, name, code, is_active, created_at, updated_at)
VALUES 
  ('12345678-0000-0000-0000-000000000002', '12345678-0000-0000-0000-000000000001', 'Export', 'project_export', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('12345678-0000-0000-0000-000000000003', '12345678-0000-0000-0000-000000000001', 'Print', 'project_print', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('12345678-0000-0000-0000-000000000004', '12345678-0000-0000-0000-000000000001', 'Change Status', 'project_change_status', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

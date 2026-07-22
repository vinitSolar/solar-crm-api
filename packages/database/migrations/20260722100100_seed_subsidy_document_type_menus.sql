BEGIN;

-- Seed Subsidy Document Types Menu
INSERT INTO menus (uid, name, code, route, icon, sort_order, parent_uid, is_active, created_at, updated_at)
VALUES 
  ('22345678-0000-0000-0000-000000000001', 'Subsidy Document Types', 'SUBSIDY_DOCUMENT_TYPES', '/subsidy-document-types', 'file-text', 10, NULL, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Seed Subsidy Document Types Features
INSERT INTO features (uid, menu_uid, name, code, is_active, created_at, updated_at)
VALUES 
  ('22345678-0000-0000-0000-000000000002', '22345678-0000-0000-0000-000000000001', 'Export', 'subsidy_doc_type_export', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('22345678-0000-0000-0000-000000000003', '22345678-0000-0000-0000-000000000001', 'Change Status', 'subsidy_doc_type_change_status', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

COMMIT;

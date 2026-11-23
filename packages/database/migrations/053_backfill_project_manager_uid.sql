-- Migration 053: Backfill project_manager_uid in projects table
-- Fallback 1: Assign to the lead's assigned user if project manager is unassigned
UPDATE projects p
SET project_manager_uid = l.assigned_to::uuid,
    updated_at = CURRENT_TIMESTAMP
FROM leads l
WHERE p.lead_uid::varchar = l.uid::varchar
  AND p.project_manager_uid IS NULL
  AND l.assigned_to IS NOT NULL
  AND l.assigned_to ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Fallback 2: Assign to the user who created the project if still unassigned
UPDATE projects p
SET project_manager_uid = p.created_by::uuid,
    updated_at = CURRENT_TIMESTAMP
WHERE p.project_manager_uid IS NULL
  AND p.created_by IS NOT NULL
  AND p.created_by::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

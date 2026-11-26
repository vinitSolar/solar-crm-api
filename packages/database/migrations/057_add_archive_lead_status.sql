-- =============================================
-- Migration: 057_add_archive_lead_status.sql
-- Description: Adds default 'Archive' lead status at the end of each tenant's lead statuses.
-- =============================================

INSERT INTO lead_statuses (uid, tenant_uid, name, color, sort_order, is_default, is_closed, is_draft, created_by)
SELECT
    gen_random_uuid()::varchar,
    t.uid,
    'Archive',
    '#64748B',
    GREATEST(
        COALESCE(
            (
                SELECT MAX(ls_max.sort_order) + 1
                FROM lead_statuses ls_max
                WHERE ls_max.tenant_uid = t.uid AND ls_max.is_deleted = 0
            ),
            8
        ),
        8
    ),
    0,
    1,
    0,
    'SYSTEM'
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1
    FROM lead_statuses ls
    WHERE ls.tenant_uid = t.uid
      AND LOWER(TRIM(ls.name)) IN ('archive', 'archived')
      AND ls.is_deleted = 0
);

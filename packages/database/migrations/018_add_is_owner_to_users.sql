-- Add is_owner column to users table
-- 1 = franchise owner (created during onboarding), 0 = regular user (default)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_owner SMALLINT NOT NULL DEFAULT 0;

-- Backfill: Mark existing franchise owner users based on their role name
UPDATE users u
SET is_owner = 1
FROM roles r
WHERE u.role_uid = r.uid
  AND r.name IN ('Franchise Owner(Admin)', 'Master')
  AND u.is_owner = 0;

-- Migration: Add composite index on user_sessions for faster auth middleware lookups
-- The authenticate middleware queries: WHERE uid = $1 AND is_active = 1 AND is_deleted = 0
-- The existing UNIQUE(uid) index doesn't cover is_active/is_deleted filtering efficiently

CREATE INDEX IF NOT EXISTS idx_user_sessions_uid_active
    ON user_sessions(uid, is_active, is_deleted);

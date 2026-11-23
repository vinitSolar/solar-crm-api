-- Migration 052: Add reminder_sent_at to follow_ups table
-- This enables automated follow-up reminder notifications to be dispatched at the scheduled time.

ALTER TABLE follow_ups
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Set reminder_sent_at = NOW() for all historical/past follow-ups so they are not retroactively notified
UPDATE follow_ups
SET reminder_sent_at = NOW()
WHERE follow_up_date < NOW() AND reminder_sent_at IS NULL;

-- Fast index for scanning active scheduled follow-ups whose reminder has not yet been sent
CREATE INDEX IF NOT EXISTS idx_follow_ups_due_reminder
  ON follow_ups(follow_up_date, status, is_active, is_deleted)
  WHERE reminder_sent_at IS NULL;

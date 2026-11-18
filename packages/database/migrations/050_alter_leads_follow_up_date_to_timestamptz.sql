-- Migration 050: Alter follow_up_date in leads table from DATE to TIMESTAMP WITH TIME ZONE
-- This ensures date and time are preserved, allowing exact time slot scheduling and conflict checks.

ALTER TABLE leads 
  ALTER COLUMN follow_up_date TYPE TIMESTAMP WITH TIME ZONE 
  USING follow_up_date::TIMESTAMP WITH TIME ZONE;

-- Sync any active follow-up times from follow_ups table into leads table
UPDATE leads l
SET follow_up_date = fu.follow_up_date
FROM follow_ups fu
WHERE fu.lead_uid = l.uid 
  AND fu.is_active = 1 
  AND fu.is_deleted = 0 
  AND fu.status = 'scheduled';

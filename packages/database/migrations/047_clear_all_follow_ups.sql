-- ============================================================
-- Clear All Follow-ups from follow_ups table & reset leads
-- ============================================================
TRUNCATE TABLE follow_ups RESTART IDENTITY;

UPDATE leads 
SET follow_up_date = NULL, is_follow_up = 0
WHERE follow_up_date IS NOT NULL OR is_follow_up = 1;


-- Update default values for subsidy_trackers status columns
ALTER TABLE subsidy_trackers ALTER COLUMN portal_status SET DEFAULT 0;
ALTER TABLE subsidy_trackers ALTER COLUMN net_meter_status SET DEFAULT 0;

-- Update column comments for portal_status and net_meter_status
COMMENT ON COLUMN subsidy_trackers.portal_status IS '0: NOT_STARTED, 1: REGISTERED, 2: DOCUMENTS_UPLOADED, 3: DOCUMENTS_SUBMITTED, 4: UNDER_VERIFICATION, 5: APPROVED, 6: REJECTED, 7: SUBSIDY_RELEASED, 8: COMPLETED';

COMMENT ON COLUMN subsidy_trackers.net_meter_status IS '0: NOT_APPLIED, 1: APPLIED, 2: INSPECTION_SCHEDULED, 3: INSPECTION_COMPLETED, 4: METER_INSTALLED, 5: EXPORT_STARTED, 6: COMPLETED';

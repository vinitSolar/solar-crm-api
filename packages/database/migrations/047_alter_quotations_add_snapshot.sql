BEGIN;

ALTER TABLE quotations ADD COLUMN snapshot_data JSONB;

COMMIT;

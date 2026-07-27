BEGIN;

ALTER TABLE quotations ADD COLUMN package_uid VARCHAR(255);
CREATE INDEX idx_quotations_package_uid ON quotations(package_uid);

COMMIT;

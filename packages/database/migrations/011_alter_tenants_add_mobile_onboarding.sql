BEGIN;

ALTER TABLE tenants ADD COLUMN mobile VARCHAR(20);
ALTER TABLE tenants ADD COLUMN onboarding_status SMALLINT DEFAULT 0; -- 0 = Pending, 1 = In Progress, 2 = Completed

COMMENT ON COLUMN tenants.mobile IS 'Business mobile number of the tenant';
COMMENT ON COLUMN tenants.onboarding_status IS '0 = Pending, 1 = In Progress, 2 = Completed';

COMMIT;

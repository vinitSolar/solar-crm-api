BEGIN;

ALTER TABLE franchise_business_details ADD COLUMN outlet_name VARCHAR(255);

COMMENT ON COLUMN franchise_business_details.outlet_name IS 'Brand name or outlet name of the franchise business';

COMMIT;

BEGIN;

ALTER TABLE product_specification_values
DROP COLUMN IF EXISTS is_visible;

COMMIT;

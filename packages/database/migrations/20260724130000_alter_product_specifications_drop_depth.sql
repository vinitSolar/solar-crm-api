BEGIN;

ALTER TABLE product_specifications
DROP COLUMN IF EXISTS depth;

COMMIT;

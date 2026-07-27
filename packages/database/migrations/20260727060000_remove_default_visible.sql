BEGIN;

ALTER TABLE product_category_specifications
DROP COLUMN IF EXISTS default_visible;

COMMIT;

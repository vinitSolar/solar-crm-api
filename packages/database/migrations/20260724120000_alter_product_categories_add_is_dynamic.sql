BEGIN;

ALTER TABLE product_categories
ADD COLUMN is_dynamic SMALLINT DEFAULT 1;

COMMENT ON COLUMN product_categories.is_dynamic IS '1 for dynamic, 0 for static/default';

COMMIT;

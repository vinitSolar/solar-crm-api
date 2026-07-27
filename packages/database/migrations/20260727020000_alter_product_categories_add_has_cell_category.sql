BEGIN;

ALTER TABLE product_categories
ADD COLUMN has_cell_category SMALLINT DEFAULT 0;

COMMENT ON COLUMN product_categories.has_cell_category IS '1 if products in this category require a cell technology, 0 otherwise';

COMMIT;

BEGIN;

-- Remove cell technology column from products
ALTER TABLE products DROP COLUMN IF EXISTS cell_technology_uid;

-- Remove has_cell_category column from product categories
ALTER TABLE product_categories DROP COLUMN IF EXISTS has_cell_category;

-- Drop the cell technologies table
DROP TABLE IF EXISTS product_cell_technologies;

COMMIT;

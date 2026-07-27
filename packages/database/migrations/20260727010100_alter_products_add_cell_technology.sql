BEGIN;

ALTER TABLE products 
ADD COLUMN cell_technology_uid VARCHAR(255) DEFAULT NULL;

ALTER TABLE product_specifications 
DROP COLUMN cell_technology;

COMMIT;

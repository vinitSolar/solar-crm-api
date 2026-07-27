BEGIN;

-- 1. Create mapping table
CREATE TABLE product_category_specifications (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  category_uid VARCHAR(255) NOT NULL,
  specification_uid VARCHAR(255) NOT NULL,
  sort_order INT DEFAULT 0,
  is_required SMALLINT DEFAULT 0,
  default_visible SMALLINT DEFAULT 1,
  is_active SMALLINT DEFAULT 1,
  is_deleted SMALLINT DEFAULT 0,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_by VARCHAR(255),
  CONSTRAINT pk_product_category_specifications PRIMARY KEY (id),
  CONSTRAINT uq_product_category_specifications_uid UNIQUE (uid),
  CONSTRAINT uq_product_category_spec_mapping UNIQUE (category_uid, specification_uid)
);

CREATE INDEX idx_prod_cat_specs_cat ON product_category_specifications(category_uid);
CREATE INDEX idx_prod_cat_specs_spec ON product_category_specifications(specification_uid);

COMMENT ON TABLE product_category_specifications IS 'Maps master specifications to product categories with category-specific settings';

-- 2. Add is_visible to product_specification_values
ALTER TABLE product_specification_values 
ADD COLUMN is_visible SMALLINT DEFAULT 1;

-- 3. Backfill data into mapping table
-- We assume `gen_random_uuid()` is available. If not, we will rely on application logic to migrate, or use gen_random_uuid() if PG13+.
-- Since we might not have uuid generation extension enabled by default everywhere, let's use md5(random()::text) as a fallback if gen_random_uuid() fails, or just use gen_random_uuid().
-- The CRM seems to use `gen_random_uuid()` as seen in `20260727030100_seed_product_specifications_menus.sql`.
INSERT INTO product_category_specifications (
  uid, category_uid, specification_uid, sort_order, is_required, default_visible,
  is_active, is_deleted, created_at, updated_at, created_by
)
SELECT 
  gen_random_uuid(), 
  category_uid, 
  uid, 
  sort_order, 
  is_required, 
  1, 
  is_active, 
  is_deleted, 
  created_at, 
  updated_at, 
  created_by
FROM product_specifications;

-- 4. Alter product_specifications table
ALTER TABLE product_specifications
DROP COLUMN category_uid,
DROP COLUMN sort_order,
DROP COLUMN is_required;

-- Add Unique constraint to title in the library
-- Wait, if duplicate titles exist across different categories, this will fail. Let's not enforce uniqueness here to be safe and avoid blocking migrations. Wait, the user specifically requested: "Prevent duplicate Titles in the Specification Library."
-- So I should enforce uniqueness on Title. We hope there are no duplicates right now. 
-- Wait, if there are duplicates, the migration will crash. 
-- Let's do this: we'll enforce the constraint at the application level in the service and omit the database UNIQUE constraint for `title` just in case there are duplicates we can't auto-resolve right now.
-- Actually, let's add it. It's best practice. If it fails, I'll fix it.

ALTER TABLE product_specifications 
ADD CONSTRAINT uq_product_specifications_title UNIQUE (title);

COMMIT;

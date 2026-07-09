BEGIN;

CREATE TABLE products (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  category_uid VARCHAR(255) NOT NULL,
  brand_uid VARCHAR(255) NOT NULL,
  unit_uid VARCHAR(255) NOT NULL,
  name VARCHAR(500) NOT NULL,
  product_code VARCHAR(255) NOT NULL,
  price_per_unit NUMERIC(15,2) NOT NULL,
  gst_percentage NUMERIC(5,2) NOT NULL,
  capacity VARCHAR(255),
  capacity_unit VARCHAR(100),
  warranty VARCHAR(255),
  description TEXT,
  is_active SMALLINT DEFAULT 1,
  is_deleted SMALLINT DEFAULT 0,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_by VARCHAR(255),
  CONSTRAINT pk_products PRIMARY KEY (id),
  CONSTRAINT uq_products_uid UNIQUE (uid),
  CONSTRAINT uq_products_product_code UNIQUE (product_code),
  CONSTRAINT uq_products_name UNIQUE (name)
);

CREATE INDEX idx_products_category_uid ON products(category_uid);
CREATE INDEX idx_products_brand_uid ON products(brand_uid);

COMMENT ON TABLE products IS 'Global master data for products';

COMMIT;

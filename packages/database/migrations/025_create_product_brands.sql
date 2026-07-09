BEGIN;

CREATE TABLE product_brands (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  logo VARCHAR(1000),
  sort_order INT DEFAULT 0,
  is_active SMALLINT DEFAULT 1,
  is_deleted SMALLINT DEFAULT 0,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_by VARCHAR(255),
  CONSTRAINT pk_product_brands PRIMARY KEY (id),
  CONSTRAINT uq_product_brands_uid UNIQUE (uid),
  CONSTRAINT uq_product_brands_name UNIQUE (name)
);

COMMENT ON TABLE product_brands IS 'Global master data for product brands';

COMMIT;

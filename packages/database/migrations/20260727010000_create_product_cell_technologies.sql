BEGIN;

CREATE TABLE product_cell_technologies (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  sort_order INT DEFAULT 0,
  is_active SMALLINT DEFAULT 1,
  is_deleted SMALLINT DEFAULT 0,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_by VARCHAR(255),
  CONSTRAINT pk_product_cell_technologies PRIMARY KEY (id),
  CONSTRAINT uq_product_cell_technologies_uid UNIQUE (uid),
  CONSTRAINT uq_product_cell_technologies_name UNIQUE (name)
);

COMMENT ON TABLE product_cell_technologies IS 'Global master data for product cell technologies';

COMMIT;

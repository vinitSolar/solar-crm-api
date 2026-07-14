BEGIN;

CREATE TABLE product_specifications (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  product_uid VARCHAR(255) NOT NULL,
  
  -- Dimensions
  height DECIMAL(10,2) DEFAULT NULL,
  width DECIMAL(10,2) DEFAULT NULL,
  depth DECIMAL(10,2) DEFAULT NULL,
  
  -- Electrical
  max_power DECIMAL(10,2) DEFAULT NULL,
  
  -- Pallet Information
  pallet_length DECIMAL(10,2) DEFAULT NULL,
  pallet_width DECIMAL(10,2) DEFAULT NULL,
  pallet_height DECIMAL(10,2) DEFAULT NULL,
  pallet_weight DECIMAL(10,2) DEFAULT NULL,
  pallet_dimension VARCHAR(255) DEFAULT NULL,
  
  -- Packaging
  quantity_per_pallet INTEGER DEFAULT NULL,
  
  -- Technical
  cell_technology VARCHAR(255) DEFAULT NULL,
  
  -- Base Fields
  is_active SMALLINT DEFAULT 1,
  is_deleted SMALLINT DEFAULT 0,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_by VARCHAR(255),
  
  CONSTRAINT pk_product_specifications PRIMARY KEY (id),
  CONSTRAINT uq_product_specifications_uid UNIQUE (uid),
  CONSTRAINT uq_product_specifications_product_uid UNIQUE (product_uid)
);

CREATE INDEX idx_product_specs_product_uid ON product_specifications(product_uid);

COMMENT ON TABLE product_specifications IS 'Stores specification details for products';

COMMIT;

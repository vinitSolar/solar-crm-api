BEGIN;

DROP TABLE IF EXISTS product_specifications;

-- Specifications definitions per Category
CREATE TABLE product_specifications (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  category_uid VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  value_type SMALLINT NOT NULL DEFAULT 0, -- 0 = Text, 1 = Number, 2 = Decimal, 3 = Dropdown, 4 = Boolean, 5 = Date
  unit_uid VARCHAR(255),
  sort_order INT DEFAULT 0,
  is_required SMALLINT DEFAULT 0,
  is_active SMALLINT DEFAULT 1,
  is_deleted SMALLINT DEFAULT 0,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_by VARCHAR(255),
  CONSTRAINT pk_product_specifications PRIMARY KEY (id),
  CONSTRAINT uq_product_specifications_uid UNIQUE (uid)
);

CREATE INDEX idx_product_specs_category_uid ON product_specifications(category_uid);

COMMENT ON TABLE product_specifications IS 'Stores dynamic specification definitions for Product Categories';

-- Options for Dropdown type specifications
CREATE TABLE product_specification_options (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  specification_uid VARCHAR(255) NOT NULL,
  value VARCHAR(255) NOT NULL,
  sort_order INT DEFAULT 0,
  is_active SMALLINT DEFAULT 1,
  is_deleted SMALLINT DEFAULT 0,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_by VARCHAR(255),
  CONSTRAINT pk_product_specification_options PRIMARY KEY (id),
  CONSTRAINT uq_product_specification_options_uid UNIQUE (uid)
);

CREATE INDEX idx_product_spec_options_spec_uid ON product_specification_options(specification_uid);

COMMENT ON TABLE product_specification_options IS 'Stores options for Dropdown product specifications';

-- Values for actual Products
CREATE TABLE product_specification_values (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  product_uid VARCHAR(255) NOT NULL,
  specification_uid VARCHAR(255) NOT NULL,
  value VARCHAR(1000),
  is_active SMALLINT DEFAULT 1,
  is_deleted SMALLINT DEFAULT 0,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_by VARCHAR(255),
  CONSTRAINT pk_product_specification_values PRIMARY KEY (id),
  CONSTRAINT uq_product_specification_values_uid UNIQUE (uid)
);

CREATE INDEX idx_product_spec_values_product_uid ON product_specification_values(product_uid);
CREATE INDEX idx_product_spec_values_spec_uid ON product_specification_values(specification_uid);

COMMENT ON TABLE product_specification_values IS 'Stores actual specification values for Products';

COMMIT;

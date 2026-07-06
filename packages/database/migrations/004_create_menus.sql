BEGIN;

CREATE TABLE menus (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  parent_uid VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(100) NOT NULL,
  route VARCHAR(255),
  icon VARCHAR(255),
  sort_order INT,
  is_active SMALLINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_menus PRIMARY KEY (id),
  CONSTRAINT uq_menus_uid UNIQUE (uid),
  CONSTRAINT uq_menus_code UNIQUE (code)
);

CREATE INDEX idx_menus_parent_uid ON menus(parent_uid);

COMMIT;

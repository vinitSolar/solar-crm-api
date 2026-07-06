BEGIN;

CREATE TABLE features (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  menu_uid VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(100) NOT NULL,
  is_active SMALLINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_features PRIMARY KEY (id),
  CONSTRAINT uq_features_uid UNIQUE (uid)
);

CREATE INDEX idx_features_menu_uid ON features(menu_uid);
CREATE INDEX idx_features_code ON features(code);

COMMIT;

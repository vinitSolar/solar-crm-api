BEGIN;

CREATE TABLE lead_sources (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  tenant_uid VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  color VARCHAR(50),
  sort_order INT DEFAULT 0,
  is_default SMALLINT DEFAULT 0,
  is_active SMALLINT DEFAULT 1,
  is_deleted SMALLINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_by VARCHAR(255),
  CONSTRAINT pk_lead_sources PRIMARY KEY (id),
  CONSTRAINT uq_lead_sources_uid UNIQUE (uid)
);

CREATE INDEX idx_lead_sources_tenant_uid ON lead_sources(tenant_uid);

COMMENT ON TABLE lead_sources IS 'Stores lead sources per tenant';

COMMIT;

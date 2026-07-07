BEGIN;

CREATE TABLE lead_statuses (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  tenant_uid VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  color VARCHAR(50),
  sort_order INT DEFAULT 0,
  is_default SMALLINT DEFAULT 0,
  is_closed SMALLINT DEFAULT 0, -- 0 = Open, 1 = Closed
  is_active SMALLINT DEFAULT 1,
  is_deleted SMALLINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_by VARCHAR(255),
  CONSTRAINT pk_lead_statuses PRIMARY KEY (id),
  CONSTRAINT uq_lead_statuses_uid UNIQUE (uid)
);

CREATE INDEX idx_lead_statuses_tenant_uid ON lead_statuses(tenant_uid);

COMMENT ON TABLE lead_statuses IS 'Stores lead statuses per tenant';

COMMIT;

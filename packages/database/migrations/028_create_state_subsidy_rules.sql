BEGIN;

CREATE TABLE state_subsidy_rules (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  state VARCHAR(255) NOT NULL,
  subsidy_per_kw NUMERIC(10,2) NOT NULL DEFAULT 0,
  maximum_subsidy_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  description TEXT,
  is_active SMALLINT DEFAULT 1,
  is_deleted SMALLINT DEFAULT 0,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_by VARCHAR(255),
  CONSTRAINT pk_state_subsidy_rules PRIMARY KEY (id),
  CONSTRAINT uq_state_subsidy_rules_uid UNIQUE (uid),
  CONSTRAINT uq_state_subsidy_rules_state UNIQUE (state)
);

COMMENT ON TABLE state_subsidy_rules IS 'Global master data for state subsidy rules managed by Head Office';

COMMIT;

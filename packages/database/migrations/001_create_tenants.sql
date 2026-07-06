BEGIN;

CREATE TABLE tenants (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  code VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type SMALLINT NOT NULL, -- 0 = Head Office, 1 = Franchise
  email VARCHAR(255),
  logo VARCHAR(500),
  timezone VARCHAR(100) DEFAULT 'Asia/Kolkata',
  is_active SMALLINT DEFAULT 1, -- 0 = Inactive, 1 = Active, 2 = Suspended
  is_deleted SMALLINT DEFAULT 0, -- 0 = No, 1 = Yes
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_by VARCHAR(255),
  CONSTRAINT pk_tenants PRIMARY KEY (id),
  CONSTRAINT uq_tenants_uid UNIQUE (uid),
  CONSTRAINT uq_tenants_code UNIQUE (code)
);

CREATE INDEX idx_tenants_email ON tenants(email);

COMMIT;

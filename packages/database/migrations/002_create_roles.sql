BEGIN;

CREATE TABLE roles (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  tenant_uid VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_system SMALLINT DEFAULT 0, -- 0 = Custom Role, 1 = System Role
  is_active SMALLINT DEFAULT 1, -- 0 = Inactive, 1 = Active
  is_deleted SMALLINT DEFAULT 0, -- 0 = No, 1 = Yes
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_by VARCHAR(255),
  CONSTRAINT pk_roles PRIMARY KEY (id),
  CONSTRAINT uq_roles_uid UNIQUE (uid)
);

CREATE INDEX idx_roles_tenant_uid ON roles(tenant_uid);

COMMIT;

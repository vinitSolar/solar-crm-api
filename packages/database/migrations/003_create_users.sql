BEGIN;

CREATE TABLE users (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  tenant_uid VARCHAR(255) NOT NULL,
  role_uid VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255),
  password VARCHAR(255),
  last_login TIMESTAMP,
  is_active SMALLINT DEFAULT 1, -- 0 = Inactive, 1 = Active, 2 = Locked
  is_deleted SMALLINT DEFAULT 0, -- 0 = No, 1 = Yes
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_by VARCHAR(255),
  CONSTRAINT pk_users PRIMARY KEY (id),
  CONSTRAINT uq_users_uid UNIQUE (uid),
  CONSTRAINT uq_users_email UNIQUE (email)
);

CREATE INDEX idx_users_tenant_uid ON users(tenant_uid);
CREATE INDEX idx_users_role_uid ON users(role_uid);


COMMIT;

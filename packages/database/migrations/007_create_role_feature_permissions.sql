BEGIN;

CREATE TABLE role_feature_permissions (
  id BIGSERIAL,
  tenant_uid VARCHAR(255) NOT NULL,
  role_uid VARCHAR(255) NOT NULL,
  feature_uid VARCHAR(255) NOT NULL,
  is_enabled SMALLINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_role_feature_permissions PRIMARY KEY (id)
);

CREATE INDEX idx_role_feature_permissions_tenant_uid ON role_feature_permissions(tenant_uid);
CREATE INDEX idx_role_feature_permissions_role_uid ON role_feature_permissions(role_uid);
CREATE INDEX idx_role_feature_permissions_feature_uid ON role_feature_permissions(feature_uid);

COMMIT;

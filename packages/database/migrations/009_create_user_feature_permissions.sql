BEGIN;

CREATE TABLE user_feature_permissions (
  id BIGSERIAL,
  tenant_uid VARCHAR(255) NOT NULL,
  user_uid VARCHAR(255) NOT NULL,
  feature_uid VARCHAR(255) NOT NULL,
  is_enabled SMALLINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_user_feature_permissions PRIMARY KEY (id)
);

CREATE INDEX idx_user_feature_permissions_tenant_uid ON user_feature_permissions(tenant_uid);
CREATE INDEX idx_user_feature_permissions_user_uid ON user_feature_permissions(user_uid);
CREATE INDEX idx_user_feature_permissions_feature_uid ON user_feature_permissions(feature_uid);

COMMIT;

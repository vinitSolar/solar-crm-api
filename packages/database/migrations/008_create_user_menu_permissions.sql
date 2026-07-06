BEGIN;

CREATE TABLE user_menu_permissions (
  id BIGSERIAL,
  tenant_uid VARCHAR(255) NOT NULL,
  user_uid VARCHAR(255) NOT NULL,
  menu_uid VARCHAR(255) NOT NULL,
  can_view SMALLINT,
  can_create SMALLINT,
  can_edit SMALLINT,
  can_delete SMALLINT,
  can_import SMALLINT,
  can_export SMALLINT,
  can_approve SMALLINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_user_menu_permissions PRIMARY KEY (id)
);

CREATE INDEX idx_user_menu_permissions_tenant_uid ON user_menu_permissions(tenant_uid);
CREATE INDEX idx_user_menu_permissions_user_uid ON user_menu_permissions(user_uid);
CREATE INDEX idx_user_menu_permissions_menu_uid ON user_menu_permissions(menu_uid);

COMMIT;

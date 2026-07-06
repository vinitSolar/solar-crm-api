BEGIN;

CREATE TABLE role_menu_permissions (
  id BIGSERIAL,
  tenant_uid VARCHAR(255) NOT NULL,
  role_uid VARCHAR(255) NOT NULL,
  menu_uid VARCHAR(255) NOT NULL,
  can_view SMALLINT DEFAULT 0,
  can_create SMALLINT DEFAULT 0,
  can_edit SMALLINT DEFAULT 0,
  can_delete SMALLINT DEFAULT 0,
  can_import SMALLINT DEFAULT 0,
  can_export SMALLINT DEFAULT 0,
  can_approve SMALLINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_role_menu_permissions PRIMARY KEY (id)
);

CREATE INDEX idx_role_menu_permissions_tenant_uid ON role_menu_permissions(tenant_uid);
CREATE INDEX idx_role_menu_permissions_role_uid ON role_menu_permissions(role_uid);
CREATE INDEX idx_role_menu_permissions_menu_uid ON role_menu_permissions(menu_uid);

COMMIT;

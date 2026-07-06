BEGIN;

CREATE TABLE user_sessions (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  user_uid VARCHAR(255) NOT NULL,
  refresh_token VARCHAR(1000) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_active SMALLINT DEFAULT 1, -- 0 = Inactive, 1 = Active, 2 = Locked
  is_deleted SMALLINT DEFAULT 0, -- 0 = No, 1 = Yes
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_by VARCHAR(255),
  CONSTRAINT pk_user_sessions PRIMARY KEY (id),
  CONSTRAINT uq_user_sessions_uid UNIQUE (uid),
  CONSTRAINT uq_user_sessions_token UNIQUE (refresh_token)
);

CREATE INDEX idx_user_sessions_user_uid ON user_sessions(user_uid);

COMMIT;

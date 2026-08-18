CREATE TABLE IF NOT EXISTS lead_notes (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  tenant_uid VARCHAR(255) NOT NULL,
  lead_uid VARCHAR(255) NOT NULL,
  note TEXT NOT NULL,
  is_active SMALLINT DEFAULT 1,
  is_deleted SMALLINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_by VARCHAR(255),
  CONSTRAINT pk_lead_notes PRIMARY KEY (id),
  CONSTRAINT uq_lead_notes_uid UNIQUE (uid)
);

CREATE INDEX IF NOT EXISTS idx_lead_notes_tenant_uid ON lead_notes(tenant_uid);
CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_uid ON lead_notes(lead_uid);

BEGIN;

CREATE TABLE site_surveys (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  tenant_uid VARCHAR(255) NOT NULL,
  lead_uid VARCHAR(255) NOT NULL,
  assigned_to VARCHAR(255) NOT NULL,
  
  -- Module specific fields
  scheduled_at TIMESTAMP NOT NULL,
  status SMALLINT NOT NULL DEFAULT 0, -- 0 = Scheduled, 1 = Completed, 2 = Cancelled, 3 = Rescheduled
  remarks TEXT,
  
  -- Base Fields
  is_active SMALLINT DEFAULT 1,
  is_deleted SMALLINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_by VARCHAR(255),
  
  CONSTRAINT pk_site_surveys PRIMARY KEY (id),
  CONSTRAINT uq_site_surveys_uid UNIQUE (uid)
);

CREATE INDEX idx_site_surveys_tenant_uid ON site_surveys(tenant_uid);
CREATE INDEX idx_site_surveys_lead_uid ON site_surveys(lead_uid);
CREATE INDEX idx_site_surveys_assigned_to ON site_surveys(assigned_to);
CREATE INDEX idx_site_surveys_status ON site_surveys(status);

COMMENT ON TABLE site_surveys IS 'Stores scheduled site surveys for Leads';

COMMIT;

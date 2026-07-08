BEGIN;

CREATE TABLE site_survey_details (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  tenant_uid VARCHAR(255) NOT NULL,
  site_survey_uid VARCHAR(255) NOT NULL,
  
  -- Technical Specifications
  roof_area_sqft DECIMAL(10, 2) NOT NULL,
  shading SMALLINT NOT NULL, -- 0=None, 1=Low, 2=Medium, 3=High
  connection_type SMALLINT NOT NULL, -- 0=Single Phase, 1=Three Phase
  sanctioned_load_kw DECIMAL(10, 2) NOT NULL,
  recommended_kw DECIMAL(10, 2),
  needs_structure_extension SMALLINT DEFAULT 0, -- 0=No, 1=Yes
  needs_optimizer SMALLINT DEFAULT 0, -- 0=No, 1=Yes
  optimizer_count INTEGER,
  notes TEXT,
  
  -- Base Fields
  is_active SMALLINT DEFAULT 1,
  is_deleted SMALLINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_by VARCHAR(255),
  
  CONSTRAINT pk_site_survey_details PRIMARY KEY (id),
  CONSTRAINT uq_site_survey_details_uid UNIQUE (uid),
  CONSTRAINT uq_site_survey_details_survey UNIQUE (site_survey_uid)
);

CREATE INDEX idx_site_survey_details_tenant_uid ON site_survey_details(tenant_uid);
CREATE INDEX idx_site_survey_details_survey_uid ON site_survey_details(site_survey_uid);

COMMENT ON TABLE site_survey_details IS 'Stores technical specifications for a site survey';

COMMIT;

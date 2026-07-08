BEGIN;

-- 1. survey_document_types
CREATE TABLE survey_document_types (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  tenant_uid VARCHAR(255) NOT NULL,
  
  -- Details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_required SMALLINT DEFAULT 0, -- 0 = Optional, 1 = Required
  allow_multiple SMALLINT DEFAULT 0, -- 0 = Single File, 1 = Multiple Files
  sort_order INT DEFAULT 0,
  is_system SMALLINT DEFAULT 0, -- 0 = Custom, 1 = Default System Document Type

  -- Base Fields
  is_active SMALLINT DEFAULT 1,
  is_deleted SMALLINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_by VARCHAR(255),
  
  CONSTRAINT pk_survey_document_types PRIMARY KEY (id),
  CONSTRAINT uq_survey_document_types_uid UNIQUE (uid)
);

CREATE INDEX idx_survey_doc_types_tenant_uid ON survey_document_types(tenant_uid);

COMMENT ON TABLE survey_document_types IS 'Configurable Survey Document Types for each tenant';

-- 2. site_survey_documents
CREATE TABLE site_survey_documents (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  tenant_uid VARCHAR(255) NOT NULL,
  site_survey_uid VARCHAR(255) NOT NULL,
  document_type_uid VARCHAR(255) NOT NULL,
  
  -- File Details
  original_name VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size BIGINT NOT NULL,
  remarks TEXT,
  
  -- Base Fields
  is_active SMALLINT DEFAULT 1,
  is_deleted SMALLINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_by VARCHAR(255),
  
  CONSTRAINT pk_site_survey_documents PRIMARY KEY (id),
  CONSTRAINT uq_site_survey_documents_uid UNIQUE (uid)
);

CREATE INDEX idx_site_survey_docs_tenant_uid ON site_survey_documents(tenant_uid);
CREATE INDEX idx_site_survey_docs_survey_uid ON site_survey_documents(site_survey_uid);
CREATE INDEX idx_site_survey_docs_type_uid ON site_survey_documents(document_type_uid);

COMMENT ON TABLE site_survey_documents IS 'Stores uploaded documents for a Site Survey';

COMMIT;

BEGIN;

-- Create franchise_documents table
CREATE TABLE franchise_documents (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  tenant_uid VARCHAR(255) NOT NULL,
  document_type_uid VARCHAR(255) NOT NULL,
  
  -- File Details
  document_number VARCHAR(255),
  original_file_name VARCHAR(255) NOT NULL,
  stored_file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size BIGINT NOT NULL,
  
  -- Base Fields
  is_active SMALLINT DEFAULT 1,
  is_deleted SMALLINT DEFAULT 0,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_by VARCHAR(255),
  
  CONSTRAINT pk_franchise_documents PRIMARY KEY (id),
  CONSTRAINT uq_franchise_documents_uid UNIQUE (uid)
);

CREATE INDEX idx_franchise_docs_tenant_uid ON franchise_documents(tenant_uid);
CREATE INDEX idx_franchise_docs_type_uid ON franchise_documents(document_type_uid);

COMMENT ON TABLE franchise_documents IS 'Stores metadata for franchise documents uploaded by tenants';

COMMIT;

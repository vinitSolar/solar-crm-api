BEGIN;

-- Create franchise_document_types table
CREATE TABLE franchise_document_types (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  tenant_uid VARCHAR(255) NOT NULL,

  -- Details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  allow_multiple SMALLINT DEFAULT 0, -- 0 = Single File, 1 = Multiple Files
  is_required SMALLINT DEFAULT 0,    -- 0 = Optional, 1 = Required
  sort_order INT DEFAULT 0,

  -- Base Fields
  is_active SMALLINT DEFAULT 1,
  is_deleted SMALLINT DEFAULT 0,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_by VARCHAR(255),

  CONSTRAINT pk_franchise_document_types PRIMARY KEY (id),
  CONSTRAINT uq_franchise_document_types_uid UNIQUE (uid)
);

-- Index for tenant-scoped queries
CREATE INDEX idx_franchise_doc_types_tenant_uid ON franchise_document_types(tenant_uid);

-- Partial unique index: prevent duplicate names within same tenant for active records
CREATE UNIQUE INDEX uq_franchise_doc_types_tenant_name
  ON franchise_document_types(tenant_uid, name)
  WHERE is_deleted = 0;

COMMENT ON TABLE franchise_document_types IS 'Configurable Franchise Document Types for each tenant';

COMMIT;

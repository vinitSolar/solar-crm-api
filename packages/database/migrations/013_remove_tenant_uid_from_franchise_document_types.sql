-- Drop unique index that includes tenant_uid
DROP INDEX IF EXISTS idx_franchise_doc_types_tenant_name;

-- Drop index for tenant_uid
DROP INDEX IF EXISTS idx_franchise_doc_types_tenant_uid;

-- Create new unique index on name only (since document types are now global)
CREATE UNIQUE INDEX IF NOT EXISTS idx_franchise_doc_types_name ON franchise_document_types(name) WHERE is_deleted = 0;

-- Drop tenant_uid column
ALTER TABLE franchise_document_types DROP COLUMN IF EXISTS tenant_uid;

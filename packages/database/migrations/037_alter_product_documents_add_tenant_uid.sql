BEGIN;

-- 1. Truncate existing data to avoid constraint issues during alter
TRUNCATE TABLE product_documents CASCADE;
TRUNCATE TABLE product_document_types CASCADE;

-- 2. Add tenant_uid to product_document_types
ALTER TABLE product_document_types ADD COLUMN tenant_uid VARCHAR(255) NOT NULL;
CREATE INDEX idx_product_doc_types_tenant_uid ON product_document_types(tenant_uid);

-- 3. Add tenant_uid to product_documents
ALTER TABLE product_documents ADD COLUMN tenant_uid VARCHAR(255) NOT NULL;
CREATE INDEX idx_product_docs_tenant_uid ON product_documents(tenant_uid);

-- 4. Adjust uniqueness constraints
ALTER TABLE product_document_types DROP CONSTRAINT IF EXISTS uq_product_document_types_name;
ALTER TABLE product_document_types ADD CONSTRAINT uq_product_document_types_tenant_name UNIQUE (tenant_uid, name);

COMMIT;

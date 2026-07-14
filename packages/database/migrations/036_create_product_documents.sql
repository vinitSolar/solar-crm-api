BEGIN;

-- 1. Create product_document_types table
CREATE TABLE product_document_types (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  
  -- Details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  allowed_extensions VARCHAR(255) DEFAULT 'pdf,jpg,jpeg,png,docx,xlsx',
  allow_multiple SMALLINT DEFAULT 0, -- 0 = Single File, 1 = Multiple Files
  is_required SMALLINT DEFAULT 0, -- 0 = Optional, 1 = Required

  -- Base Fields
  is_active SMALLINT DEFAULT 1,
  is_deleted SMALLINT DEFAULT 0,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_by VARCHAR(255),
  
  CONSTRAINT pk_product_document_types PRIMARY KEY (id),
  CONSTRAINT uq_product_document_types_uid UNIQUE (uid),
  CONSTRAINT uq_product_document_types_name UNIQUE (name)
);

COMMENT ON TABLE product_document_types IS 'Global configuration of product document types';

-- 2. Create product_documents table
CREATE TABLE product_documents (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  product_uid VARCHAR(255) NOT NULL,
  document_type_uid VARCHAR(255) NOT NULL,
  
  -- File Details
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
  
  CONSTRAINT pk_product_documents PRIMARY KEY (id),
  CONSTRAINT uq_product_documents_uid UNIQUE (uid)
);

CREATE INDEX idx_product_docs_product_uid ON product_documents(product_uid);
CREATE INDEX idx_product_docs_type_uid ON product_documents(document_type_uid);

COMMENT ON TABLE product_documents IS 'Stores metadata for product documents';

-- 3. Seed default product document types
INSERT INTO product_document_types (uid, name, description, allowed_extensions, allow_multiple, is_required)
VALUES 
  ('165d21c4-2736-47b2-b1cf-712e524d77ba', 'Datasheet', 'Technical specification datasheet for the product', 'pdf,doc,docx', 0, 0),
  ('2e3cda4b-568b-4b21-817a-8fbd8eb0cdb6', 'Warranty Document', 'Warranty terms and guidelines', 'pdf,jpg,jpeg,png', 0, 0),
  ('ef6e53d5-d018-4e1b-b461-125bd4e2e28a', 'Installation Manual', 'Guide for installing and configuring the product', 'pdf', 0, 0),
  ('bd7c5e26-a0ef-4f11-9a71-3bfd722da10c', 'Technical Drawing', 'Engineering drawings or schematics', 'pdf,dwg,dxf,jpg,png', 1, 0),
  ('8d6f51cb-1c09-411a-8260-249ebd7e8a15', 'Product Images', 'Marketing or reference images of the product', 'jpg,jpeg,png,webp', 1, 0);

COMMIT;

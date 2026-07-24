BEGIN;

-- Insert default product document types for every tenant currently in the system
-- Uses gen_random_uuid() so each tenant gets unique UIDs
INSERT INTO product_document_types (uid, tenant_uid, name, description, allowed_extensions, allow_multiple, is_required)
SELECT 
  gen_random_uuid(),
  t.uid,
  'Datasheet',
  'Technical specification datasheet for the product',
  'pdf,doc,docx',
  0,
  0
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM product_document_types pdt WHERE pdt.tenant_uid = t.uid AND pdt.name = 'Datasheet'
);

INSERT INTO product_document_types (uid, tenant_uid, name, description, allowed_extensions, allow_multiple, is_required)
SELECT 
  gen_random_uuid(),
  t.uid,
  'Warranty Document',
  'Warranty terms and guidelines',
  'pdf,jpg,jpeg,png',
  0,
  0
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM product_document_types pdt WHERE pdt.tenant_uid = t.uid AND pdt.name = 'Warranty Document'
);

INSERT INTO product_document_types (uid, tenant_uid, name, description, allowed_extensions, allow_multiple, is_required)
SELECT 
  gen_random_uuid(),
  t.uid,
  'Installation Manual',
  'Guide for installing and configuring the product',
  'pdf',
  0,
  0
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM product_document_types pdt WHERE pdt.tenant_uid = t.uid AND pdt.name = 'Installation Manual'
);

INSERT INTO product_document_types (uid, tenant_uid, name, description, allowed_extensions, allow_multiple, is_required)
SELECT 
  gen_random_uuid(),
  t.uid,
  'Technical Drawing',
  'Engineering drawings or schematics',
  'pdf,dwg,dxf,jpg,png',
  1,
  0
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM product_document_types pdt WHERE pdt.tenant_uid = t.uid AND pdt.name = 'Technical Drawing'
);

-- Note: The API hardcodes a specific UUID fallback if this name isn't found, but it looks it up by name first.
INSERT INTO product_document_types (uid, tenant_uid, name, description, allowed_extensions, allow_multiple, is_required)
SELECT 
  gen_random_uuid(),
  t.uid,
  'Product Images',
  'Marketing or reference images of the product',
  'jpg,jpeg,png,webp',
  1,
  0
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM product_document_types pdt WHERE pdt.tenant_uid = t.uid AND pdt.name = 'Product Images'
);

COMMIT;

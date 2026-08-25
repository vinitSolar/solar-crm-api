-- Drop unique index that includes tenant_uid
DROP INDEX IF EXISTS idx_franchise_doc_types_tenant_name;

-- Drop index for tenant_uid
DROP INDEX IF EXISTS idx_franchise_doc_types_tenant_uid;

-- Clean up duplicates by keeping the one with the smallest uid
-- Re-point any franchise_documents to the single surviving document type uid
UPDATE franchise_documents fd
SET document_type_uid = keep.uid
FROM franchise_document_types dup
JOIN (
    SELECT name, MIN(uid) as uid
    FROM franchise_document_types
    WHERE is_deleted = 0
    GROUP BY name
) keep ON dup.name = keep.name
WHERE fd.document_type_uid = dup.uid
  AND dup.is_deleted = 0
  AND dup.uid != keep.uid;

-- Now delete the duplicate franchise_document_types
DELETE FROM franchise_document_types dup
USING (
    SELECT name, MIN(uid) as uid
    FROM franchise_document_types
    WHERE is_deleted = 0
    GROUP BY name
) keep
WHERE dup.name = keep.name
  AND dup.is_deleted = 0
  AND dup.uid != keep.uid;

-- Create new unique index on name only (since document types are now global)
CREATE UNIQUE INDEX IF NOT EXISTS idx_franchise_doc_types_name ON franchise_document_types(name) WHERE is_deleted = 0;

-- Drop tenant_uid column
ALTER TABLE franchise_document_types DROP COLUMN IF EXISTS tenant_uid;

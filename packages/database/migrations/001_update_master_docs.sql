-- Temporary migration to update applicable_modules for existing master documents
-- This will be removed in the next push as requested

UPDATE master_document_types 
SET applicable_modules = '{"site_survey","project","subsidy_tracker","finance","discom"}'
WHERE name = 'Aadhaar Card' AND is_system = 1 AND tenant_uid IS NULL;

UPDATE master_document_types 
SET applicable_modules = '{"site_survey","project","finance","discom"}'
WHERE name = 'PAN Card' AND is_system = 1 AND tenant_uid IS NULL;

UPDATE master_document_types 
SET applicable_modules = '{"site_survey","discom"}'
WHERE name = 'Electricity Bill' AND is_system = 1 AND tenant_uid IS NULL;

UPDATE master_document_types 
SET applicable_modules = '{"finance"}'
WHERE name = 'GST Certificate' AND is_system = 1 AND tenant_uid IS NULL;

UPDATE master_document_types 
SET applicable_modules = '{"finance"}'
WHERE name = 'Bank Cancelled Cheque' AND is_system = 1 AND tenant_uid IS NULL;

UPDATE master_document_types 
SET applicable_modules = '{"finance"}'
WHERE name = 'Partnership Deed / COI' AND is_system = 1 AND tenant_uid IS NULL;

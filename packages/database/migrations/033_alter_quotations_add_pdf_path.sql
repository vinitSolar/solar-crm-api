BEGIN;

ALTER TABLE quotations ADD COLUMN pdf_path VARCHAR(1000);

COMMENT ON COLUMN quotations.pdf_path IS 'Storage key/path of the generated quotation PDF document in the storage provider';

COMMIT;

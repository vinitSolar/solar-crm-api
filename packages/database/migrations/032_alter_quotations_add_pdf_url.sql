BEGIN;

ALTER TABLE quotations ADD COLUMN pdf_url VARCHAR(1000);

COMMENT ON COLUMN quotations.pdf_url IS 'Public URL of the generated quotation PDF document stored in Cloudflare R2 / local storage';

COMMIT;

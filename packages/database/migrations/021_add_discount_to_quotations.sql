-- Add discount column to quotations table
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS discount NUMERIC(15, 2) DEFAULT 0;

COMMENT ON COLUMN quotations.discount IS 'Discount amount applied on the quotation';

-- Add extra column to quotations table
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS extra JSONB DEFAULT NULL;

COMMENT ON COLUMN quotations.extra IS 'Extra charges or details with value and description for quotation';

BEGIN;

ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_number VARCHAR(255);

-- Update existing records if any
UPDATE leads SET lead_number = 'SS' || LPAD(id::text, 5, '0') WHERE lead_number IS NULL;

-- Make it not null and unique
ALTER TABLE leads ALTER COLUMN lead_number SET NOT NULL;
ALTER TABLE leads ADD CONSTRAINT uq_leads_lead_number UNIQUE (lead_number);

COMMIT;

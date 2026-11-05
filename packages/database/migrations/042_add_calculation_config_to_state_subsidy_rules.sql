-- Migration 042: Add calculation_type and calculation_config to state_subsidy_rules
ALTER TABLE state_subsidy_rules ADD COLUMN IF NOT EXISTS calculation_type VARCHAR(50) DEFAULT 'CAPACITY_SLABS';
ALTER TABLE state_subsidy_rules ADD COLUMN IF NOT EXISTS calculation_config JSONB DEFAULT '{}'::jsonb;

-- Default Central PM Surya Ghar scheme to CAPACITY_SLABS with standard slabs
UPDATE state_subsidy_rules
SET calculation_type = 'CAPACITY_SLABS',
    calculation_config = '{
      "calculationType": "CAPACITY_SLABS",
      "capacitySlabs": [
        {"fromKw": 0, "toKw": 2, "ratePerKw": 30000},
        {"fromKw": 2, "toKw": 3, "ratePerKw": 18000}
      ],
      "maximumSubsidyAmount": 78000
    }'::jsonb
WHERE (state_uid IS NULL OR state_uid = 'All' OR LOWER(COALESCE(scheme_name, '')) LIKE '%surya%ghar%')
  AND (calculation_config IS NULL OR calculation_config = '{}'::jsonb);


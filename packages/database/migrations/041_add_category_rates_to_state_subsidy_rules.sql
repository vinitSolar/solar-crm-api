-- Migration 041: Add category_rates column to state_subsidy_rules table
ALTER TABLE state_subsidy_rules ADD COLUMN IF NOT EXISTS category_rates JSONB DEFAULT '[]'::jsonb;

-- Backfill category_rates for existing rules using their default subsidy_per_kw and maximum_subsidy_amount
UPDATE state_subsidy_rules
SET category_rates = jsonb_build_array(
  jsonb_build_object(
    'categories', categories,
    'subsidyPerKw', subsidy_per_kw,
    'maximumSubsidyAmount', maximum_subsidy_amount
  )
)
WHERE category_rates IS NULL OR category_rates = '[]'::jsonb;


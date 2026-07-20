BEGIN;

ALTER TABLE state_subsidy_rules DROP CONSTRAINT IF EXISTS uq_state_subsidy_rules_state;
ALTER TABLE state_subsidy_rules DROP COLUMN IF EXISTS state;

COMMIT;

BEGIN;

ALTER TABLE state_subsidy_rules ADD COLUMN state_uid VARCHAR(255) NULL;

-- We could add a foreign key constraint here, but sometimes state_uid might be 'All' if they don't send null.
-- Actually, a foreign key is better if it matches exactly. I will leave it as simple column for now as other tables do.

COMMIT;

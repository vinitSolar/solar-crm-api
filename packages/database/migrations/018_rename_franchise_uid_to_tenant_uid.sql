BEGIN;

DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='franchise_owner_details' AND column_name='franchise_uid') THEN
    ALTER TABLE franchise_owner_details RENAME COLUMN franchise_uid TO tenant_uid;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='franchise_business_details' AND column_name='franchise_uid') THEN
    ALTER TABLE franchise_business_details RENAME COLUMN franchise_uid TO tenant_uid;
  END IF;
END $$;

COMMIT;

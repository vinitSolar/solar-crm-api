BEGIN;

DO $$
BEGIN
  IF EXISTS(SELECT *
    FROM information_schema.columns
    WHERE table_name='leads' and column_name='required_kw')
  THEN
      ALTER TABLE leads RENAME COLUMN required_kw TO system_size;
  END IF;
END $$;

COMMIT;

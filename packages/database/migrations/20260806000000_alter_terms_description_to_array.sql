BEGIN;

-- 1. Alter quotation_terms_conditions table description column to array type
ALTER TABLE quotation_terms_conditions 
  ALTER COLUMN description TYPE TEXT[] 
  USING ARRAY[description];

-- 2. Alter quotation_terms_conditions_items table description column to array type
ALTER TABLE quotation_terms_conditions_items 
  ALTER COLUMN description TYPE TEXT[] 
  USING ARRAY[description];

COMMIT;

-- Remove status column from payments table
ALTER TABLE payments
DROP COLUMN IF EXISTS status;

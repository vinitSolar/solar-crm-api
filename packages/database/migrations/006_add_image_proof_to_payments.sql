-- Add image_proof column to payments table
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS image_proof TEXT;

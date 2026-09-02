-- Add gst column to packages table
ALTER TABLE packages ADD COLUMN IF NOT EXISTS gst NUMERIC(5, 2);

COMMENT ON COLUMN packages.gst IS 'GST percentage for the package';

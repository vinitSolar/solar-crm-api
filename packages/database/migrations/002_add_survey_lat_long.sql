DO $$ 
BEGIN
    -- 1. Add columns to site_survey_details if they don't exist
    ALTER TABLE site_survey_details 
    ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 7) NULL,
    ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7) NULL;

    -- 2. Migrate data if site_surveys still has latitude and longitude columns
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'site_surveys' AND column_name = 'latitude'
    ) THEN
        EXECUTE '
            UPDATE site_survey_details ssd
            SET latitude = ss.latitude,
                longitude = ss.longitude
            FROM site_surveys ss
            WHERE ssd.site_survey_uid = ss.uid
              AND (ss.latitude IS NOT NULL OR ss.longitude IS NOT NULL)
              AND ssd.latitude IS NULL;
        ';

        -- 3. Drop columns from site_surveys
        ALTER TABLE site_surveys 
        DROP COLUMN IF EXISTS latitude,
        DROP COLUMN IF EXISTS longitude;
    END IF;
END $$;

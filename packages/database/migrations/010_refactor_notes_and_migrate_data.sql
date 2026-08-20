-- 1. Rename lead_notes to notes
ALTER TABLE lead_notes RENAME TO notes;

-- 2. Rename lead_uid to module_uid
ALTER TABLE notes RENAME COLUMN lead_uid TO module_uid;

-- 3. Add module column
ALTER TABLE notes ADD COLUMN module VARCHAR(255);

-- Update existing records in notes to have module = 'lead'
UPDATE notes SET module = 'lead' WHERE module IS NULL;

-- Make module NOT NULL now
ALTER TABLE notes ALTER COLUMN module SET NOT NULL;

-- 4. Recreate Indexes for notes table
DROP INDEX IF EXISTS idx_lead_notes_tenant_uid;
DROP INDEX IF EXISTS idx_lead_notes_lead_uid;
CREATE INDEX IF NOT EXISTS idx_notes_tenant_uid ON notes(tenant_uid);
CREATE INDEX IF NOT EXISTS idx_notes_module_uid ON notes(module_uid);
CREATE INDEX IF NOT EXISTS idx_notes_module ON notes(module);

-- 5. Data Migration from existing tables & Drop Columns safely
DO $$
BEGIN
    -- site_surveys
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='site_surveys' AND column_name='remarks') THEN
        INSERT INTO notes (uid, tenant_uid, module, module_uid, note, is_active, is_deleted, created_at, updated_at, created_by, updated_by)
        SELECT gen_random_uuid()::varchar, tenant_uid, 'site_survey', uid, remarks, is_active, is_deleted, created_at, updated_at, created_by, updated_by
        FROM site_surveys WHERE remarks IS NOT NULL AND remarks != '';
        
        ALTER TABLE site_surveys DROP COLUMN remarks;
    END IF;

    -- site_survey_details
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='site_survey_details' AND column_name='notes') THEN
        INSERT INTO notes (uid, tenant_uid, module, module_uid, note, created_at, updated_at, created_by)
        SELECT gen_random_uuid()::varchar, tenant_uid, 'site_survey_details', uid, notes, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, created_by
        FROM site_survey_details WHERE notes IS NOT NULL AND notes != '';
        
        ALTER TABLE site_survey_details DROP COLUMN notes;
    END IF;

    -- subsidy_trackers
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subsidy_trackers' AND column_name='remarks') THEN
        INSERT INTO notes (uid, tenant_uid, module, module_uid, note, created_at, updated_at, created_by, updated_by)
        SELECT gen_random_uuid()::varchar, tenant_uid, 'subsidy_tracker', uid, remarks, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL, NULL
        FROM subsidy_trackers WHERE remarks IS NOT NULL AND remarks != '';
        
        ALTER TABLE subsidy_trackers DROP COLUMN remarks;
    END IF;

    -- projects
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='remarks') THEN
        INSERT INTO notes (uid, tenant_uid, module, module_uid, note, is_active, is_deleted, created_at, updated_at, created_by, updated_by)
        SELECT gen_random_uuid()::varchar, tenant_uid, 'project', uid, remarks, is_active, is_deleted, created_at, updated_at, created_by, updated_by
        FROM projects WHERE remarks IS NOT NULL AND remarks != '';
        
        ALTER TABLE projects DROP COLUMN remarks;
    END IF;

    -- project_installation_milestones
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='project_installation_milestones' AND column_name='remarks') THEN
        INSERT INTO notes (uid, tenant_uid, module, module_uid, note, created_at, updated_at, created_by, updated_by)
        SELECT gen_random_uuid()::varchar, tenant_uid, 'project_installation_milestone', uid, remarks, created_at, updated_at, created_by, updated_by
        FROM project_installation_milestones WHERE remarks IS NOT NULL AND remarks != '';
        
        ALTER TABLE project_installation_milestones DROP COLUMN remarks;
    END IF;

    -- project_subsidy_documents
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='project_subsidy_documents' AND column_name='remarks') THEN
        INSERT INTO notes (uid, tenant_uid, module, module_uid, note, created_at, updated_at, created_by, updated_by)
        SELECT gen_random_uuid()::varchar, tenant_uid, 'project_subsidy_document', uid, remarks, created_at, updated_at, created_by, updated_by
        FROM project_subsidy_documents WHERE remarks IS NOT NULL AND remarks != '';
        
        ALTER TABLE project_subsidy_documents DROP COLUMN remarks;
    END IF;

    -- leads
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='remarks') THEN
        INSERT INTO notes (uid, tenant_uid, module, module_uid, note, is_active, is_deleted, created_at, updated_at, created_by, updated_by)
        SELECT gen_random_uuid()::varchar, tenant_uid, 'lead', uid, remarks, is_active, is_deleted, created_at, updated_at, created_by, updated_by
        FROM leads WHERE remarks IS NOT NULL AND remarks != '';
        
        ALTER TABLE leads DROP COLUMN remarks;
    END IF;

END $$;

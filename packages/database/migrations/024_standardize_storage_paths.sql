-- Drop redundant full-URL columns (path columns already exist)
ALTER TABLE master_documents DROP COLUMN IF EXISTS file_url;
ALTER TABLE project_installation_milestone_documents DROP COLUMN IF EXISTS image_url;
ALTER TABLE quotations DROP COLUMN IF EXISTS pdf_url;
